const { sceneModel, sessionModel } = require('../schemas')
const folder = require('./folder')
const { ObjectId } = require('mongodb')
const { connect } = require('mongoose')
const networking = require('./networking')

async function prepareConnection() {
    return new Promise((resolve, reject) => {
        if (global.databaseConnected !== true) {
            connect('mongodb://127.0.0.1:27017/rpg-viewer').then((db) => {
                global.databaseConnected = true
                db.connection.once("error", (err) => {
                    console.error("Mongoose error:", err)
                    setTimeout(async () => {
                        console.warn("Trying to reconnect...")
                        await prepareConnection()
                        resolve()
                    }, 5000)
                })
                resolve()
            }).catch((...err) => reject(...err))
        } else {
            resolve()
        }
    })
}

module.exports = {
    get: async function (sceneId) {
        await prepareConnection()

        const scene = await sceneModel.findById(sceneId).exec()
        if (scene) return scene
        else throw new Error('Failed to load scene data')
    },

    getAll: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (session) return session.scenes
        else throw new Error('Invalid session id')
    },

    create: async function (sessionId, path, data, image) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            await networking.uploadFile(data.data.image, image).then(null, (rejected) => {
                reject(rejected)
            })
            const document = await sessionModel.findById(sessionId).exec()
            if (document) {
                const scene = await sceneModel.create(data)
                if (scene) {
                    const targetFolder = await folder.get(document.scenes, path)
                    if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.${targetFolder.path}.contents`]: scene._id } }).exec()
                    else await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes`]: scene._id } }).exec()

                    resolve(scene._id)
                }
                else reject('Failed to create scene')
            } else reject('Failed to create scene')

        })
    },

    remove: async function (sessionId, path, sceneId) {
        await prepareConnection()
        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const targetFolder = await folder.get(document.scenes, path)
            if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.${targetFolder.path}.contents`]: sceneId } }).exec()
            else await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes`]: sceneId } }).exec()

            const scene = await sceneModel.findByIdAndDelete(sceneId).exec()
            if (scene) {
                await networking.modifyFile(scene.image)
                if (!document.state.scene) return false
                return document.state.scene.equals(sceneId)
            }
            else throw new Error('Failed to remove scene')
        } else throw new Error('Failed to create scene')
    },

    modify: async function (sessionId, sceneId, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { data: data.data, grid: data.grid, fogOfWar: data.fogOfWar, walls: data.walls } }).exec()
        if (!update) throw new Error('Failed to modify scene')
    },

    rename: async function (sceneId, name) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { 'data.name': name } }).exec()
        if (!update) throw new Error('Failed to rename scene')
    },

    move: async function (sessionId, sceneId, oldPath, newPath) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const oldFolder = await folder.get(document.scenes, oldPath)

            let pull
            let push

            if (!oldPath) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes`]: sceneId } }).exec()
            else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.${oldFolder.path}.contents`]: sceneId } }).exec()

            if (pull) {
                const newState = await sessionModel.findById(sessionId).exec()
                const newFolder = await folder.get(newState.scenes, newPath)

                if (!newPath) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes`]: sceneId } }).exec()
                else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.${newFolder.path}.contents`]: sceneId } }).exec()

                if (!push) throw new Error('Failed to move scene')
            }
            else throw new Error('Failed to move scene')
        } else throw new Error('Failed to move scene')
    },

    createFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const struct = {
                id: new ObjectId(),
                name: name,
                subFolders: [],
                contents: []
            }

            const targetFolder = await folder.get(document.scenes, path)
            if (targetFolder) {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.${targetFolder.path}.subFolders`]: struct } }).exec()
                if (update) return struct.id
                else throw new Error('Failed to create folder')
            } else {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes`]: struct } }).exec()
                if (update) return struct.id
                else throw new Error('Failed to create folder')
            }
        } else throw new Error('Failed to create folder')
    },

    removeFolder: async function (sessionId, path) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const oldFolder = await folder.get(document.scenes, path)
            for (let i = 0; i < oldFolder.contents.length; i++) {
                const element = oldFolder.contents[i];
                await this.remove(sessionId, path, element)
            }

            let paths = path.split('/')
            const folderId = paths.pop()

            const targetFolder = await folder.get(document.scenes, paths.join('/'))
            if (targetFolder) {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.${targetFolder.path}.subFolders`]: { id: ObjectId(folderId) } } }).exec()
                if (!update) throw new Error('Failed to remove folder')
            } else {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes`]: { id: ObjectId(folderId) } } }).exec()
                if (!update) throw new Error('Failed to remove folder')
            }
        } else throw new Error('Failed to remove folder')
    },

    renameFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const targetFolder = await folder.get(document.scenes, path)
            if (targetFolder) {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.${targetFolder.path}.name`]: name } }).exec()
                if (!update) throw new Error('Failed to rename folder')
            } else throw new Error('Failed to rename folder')
        } else throw new Error('Failed to rename folder')
    },

    moveFolder: async function (sessionId, oldPath, newPath) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            let oldPaths = oldPath.split('/')
            const oldId = oldPaths.pop()

            let pull
            let push

            const oldFolder = await folder.get(document.scenes, oldPaths.join('/'))
            if (oldFolder) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.${oldFolder.path}.subFolders`]: { id: ObjectId(oldId) } } }).exec()
            else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes`]: { id: ObjectId(oldId) } } }).exec()

            if (pull) {
                const newState = await sessionModel.findById(sessionId).exec()
                const newFolder = await folder.get(newState.scenes, newPath)
                if (newFolder) {
                    if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.${newFolder.path}.subFolders`]: oldFolder.subFolders.find(obj => obj.id == oldId) } }).exec()
                    else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.${newFolder.path}.subFolders`]: document.scenes.find(obj => obj.id == oldId) } }).exec()
                } else {
                    if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes`]: oldFolder.subFolders.find(obj => obj.id == oldId) } }).exec()
                    else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes`]: document.scenes.find(obj => obj.id == oldId) } }).exec()
                }
                if (push) return
                else throw new Error('Failed to move folder')
            }
            else throw new Error('Failed to move folder')
        } else throw new Error('Failed to move folder')
    },

    toggleDoor: async function (sceneId, doorId, state) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { 'walls.$[element].open': state } }, { arrayFilters: [{ 'element.wallId': doorId }] }).exec()
        if (!update) throw new Error('Failed to toggle door state')
    },

    modifyDoor: async function (sceneId, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { 'walls.$[element]': data } }, { arrayFilters: [{ 'element.wallId': data.wallId }] }).exec()
        if (!update) throw new Error('Failed to update wall data')
    },

    createLight: async function (sceneId, data) {
        await prepareConnection()

        data.id = new ObjectId()
        const update = await sceneModel.findByIdAndUpdate(sceneId, { $addToSet: { lights: data } }).exec()
        if (update) return JSON.stringify(data)
        else throw new Error('Failed to create light source')
    },

    modifyLight: async function (sceneId, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { 'lights.$[element]': data } }, { arrayFilters: [{ 'element.id': ObjectId(data.id) }] }).exec()
        if (update) return JSON.stringify(data)
        else throw new Error('Failed to update light source')
    },

    removeLight: async function (sceneId, lightId) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $pull: { 'lights': { id: lightId } } }).exec()
        if (!update) throw new Error('Failed to remove light source')
    },

    setInitiatives: async function (sceneId, data) {
        await prepareConnection()

        const scene = await sceneModel.findById(sceneId).exec()
        if (scene) {
            const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { initiatives: data } }).exec()
            if (!update) throw new Error('Failed to update initiatives')
        } else throw new Error('Scene not found')
    }
}