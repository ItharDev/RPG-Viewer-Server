const { blueprintModel, sessionModel } = require('../schemas')
const folder = require('./folder')
const account = require('./account')
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
    get: async function (blueprintId) {
        await prepareConnection()

        const document = await blueprintModel.findById(blueprintId).exec()
        if (document) return document
        else throw new Error('Failed to load blueprint data')
    },

    loadDirectory: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (session) {
            return session.blueprints
        } else throw new Error('Invalid session id')
    },

    create: async function (sessionId, path, data, image) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            await networking.uploadFile(data.image, image).then(null, (rejected) => {
                reject(rejected)
                return
            })
            const document = await sessionModel.findById(sessionId).exec()
            if (document) {
                const blueprint = await blueprintModel.create(data)
                if (blueprint) {
                    const f = await folder.get(document.blueprints, path)
                    if (f) {
                        const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.${f.path}.contents`]: blueprint._id } }).exec()
                    } else {
                        const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints`]: blueprint._id } }).exec()
                    }
                    resolve(blueprint)
                }
                else throw new Error('Failed to create blueprint')
            } else throw new Error('Failed to create blueprint')
        })
    },

    remove: async function (sessionId, path, blueprintId) {
        await prepareConnection()
        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const f = await folder.get(document.blueprints, path)
            if (f) {
                const pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.${f.path}.contents`]: blueprintId } }).exec()
            } else {
                const pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints`]: blueprintId } }).exec()
            }

            const blueprint = await blueprintModel.findByIdAndDelete(blueprintId)
            if (blueprint) {
                await networking.modifyFile(blueprint.image, -1)
                return
            }
            else throw new Error('Failed to remove blueprint')
        } else throw new Error('Failed to create blueprint')
    },

    modify: async function (blueprintId, data, image) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            if (image) {
                await networking.modifyFile(data.image, -1).then(async (resolved) => {
                    data.image = new ObjectId()
                    await networking.uploadFile(data.image, image).then(null, (rejected) => {
                        reject(rejected)
                        return
                    })
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }

            data._id = blueprintId
            const replace = await blueprintModel.replaceOne({ _id: blueprintId }, data).exec()
            if (replace) resolve(data.image)
            else reject('Failed to modify blueprint')
        })
    },

    refreshPermissions: async function (sessionId, blueprintId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        const blueprint = await blueprintModel.findById(blueprintId).exec()
        for (let i = 0; i < session.users.length; i++) {
            const user = await account.get(session.users[i]);
            if (!blueprint.permissions.find(obj => obj.user.equals(user._id))) {
                const permission = {
                    user: user._id,
                    permission: 0
                }
                const update = await blueprintModel.findByIdAndUpdate(blueprintId, { $addToSet: { permissions: permission } }).exec()
            }
        }

        const newState = await blueprintModel.findById(blueprintId).exec()
        return newState
    },

    setPermissions: async function (blueprintId, permissions) {
        await prepareConnection()

        const update = await blueprintModel.findByIdAndUpdate(blueprintId, { $set: { permissions: permissions } }).exec()
        if (update) return
        else throw new Error('Failed to update permissions')
    },

    move: async function (sessionId, blueprintId, oldPath, newPath) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const oldFolder = await folder.get(document.blueprints, oldPath)

            let pull
            let push

            if (!oldPath) {
                pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints`]: blueprintId } }).exec()
            } else {
                pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.${oldFolder.path}.contents`]: blueprintId } }).exec()
            }
            if (pull) {
                const newState = await sessionModel.findById(sessionId).exec()
                const newFolder = await folder.get(newState.blueprints, newPath)

                if (!newPath) {
                    push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints`]: blueprintId } }).exec()
                } else {
                    push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.${newFolder.path}.contents`]: blueprintId } }).exec()
                }
                if (push) return
                else throw new Error('Failed to move blueprint')
            }
            else throw new Error('Failed to move blueprint')
        } else throw new Error('Failed to move blueprint')
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

            const f = await folder.get(document.blueprints, path)
            if (f) {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.${f.path}.subFolders`]: struct } }).exec()
                if (update) return struct.id
                else throw new Error('Failed to create folder')
            } else {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints`]: struct } }).exec()
                if (update) return struct.id
                else throw new Error('Failed to create folder')
            }
        } else throw new Error('Failed to create folder')
    },

    removeFolder: async function (sessionId, path) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const oldFolder = await folder.get(document.blueprints, path)
            for (let i = 0; i < oldFolder.contents.length; i++) {
                const element = oldFolder.contents[i];
                await this.remove(sessionId, path, element)
            }

            let paths = path.split('/')
            const folderId = paths.pop()

            const f = await folder.get(document.blueprints, paths.join('/'))
            if (f) {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.${f.path}.subFolders`]: { id: ObjectId(folderId) } } }).exec()
                if (update) return
                else throw new Error('Failed to remove folder')
            } else {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints`]: { id: ObjectId(folderId) } } }).exec()
                if (update) return
                else throw new Error('Failed to remove folder')
            }
        } else throw new Error('Failed to remove folder')
    },

    renameFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const f = await folder.get(document.blueprints, path)
            if (f) {
                const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.${f.path}.name`]: name } }).exec()
                if (update) return
                else throw new Error('Failed to rename folder')
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

            const oldFolder = await folder.get(document.blueprints, oldPaths.join('/'))
            if (oldFolder) {
                pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.${oldFolder.path}.subFolders`]: { id: ObjectId(oldId) } } }).exec()
            } else {
                pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints`]: { id: ObjectId(oldId) } } }).exec()
            }

            if (pull) {
                const newState = await sessionModel.findById(sessionId).exec()
                const newFolder = await folder.get(newState.blueprints, newPath)
                if (newFolder) {
                    if (oldFolder) {
                        push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.${newFolder.path}.subFolders`]: oldFolder.subFolders.find(obj => obj.id == oldId) } }).exec()
                    } else {
                        push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.${newFolder.path}.subFolders`]: document.blueprints.find(obj => obj.id == oldId) } }).exec()
                    }
                } else {
                    if (oldFolder) {
                        push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints`]: oldFolder.subFolders.find(obj => obj.id == oldId) } }).exec()
                    } else {
                        push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints`]: document.blueprints.find(obj => obj.id == oldId) } }).exec()
                    }
                }
                if (push) return
                else throw new Error('Failed to move folder')
            }
            else throw new Error('Failed to move folder')
        } else throw new Error('Failed to move folder')
    }
}