const { sceneModel, sessionModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { connect } = require("mongoose")
const networking = require("./networking")
const getFolder = require("./getFolder")

async function prepareConnection() {
    return new Promise((resolve, reject) => {
        if (global.databaseConnected !== true) {
            connect("mongodb://127.0.0.1:27017/rpg-viewer-dev").then((db) => {
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
    /**
     * Get-scene handler
     * @param {ObjectId} sceneId
     * @returns {Promise<sceneModel>}
    */
    get: async function (sceneId) {
        await prepareConnection()

        const scene = await sceneModel.findById(sceneId).exec()
        if (!scene) throw new Error("Invalid scene id")

        return scene
    },

    /**
     * Get-all-scenes handler
     * @param {ObjectId} sessionId
     * @returns {Promise<Array>}
    */
    getAll: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        return session.scenes
    },

    /**
     * Create-scene handler
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {sceneModel} data
     * @param {Buffer} buffer
     * @returns {Promise<string>}
    */
    create: async function (sessionId, path, data, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            await networking.uploadFile(data.info.image, buffer).then(null, (rejected) => {
                reject(rejected)
            })

            const session = await sessionModel.findById(sessionId).exec()
            if (!session) reject("Invalid session id")

            const scene = await sceneModel.create(data)
            if (!scene) reject("Failed to create scene")

            const targetFolder = await getFolder(session.scenes, path)
            if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.folders.${targetFolder.path}.contents`]: scene._id } }).exec()
            else await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.contents`]: scene._id } }).exec()

            resolve(scene._id)
        })
    },

    /**
     * Remove-scene handler
     * @param {ObjectId} sessionId 
     * @param {string} path 
     * @param {ObjectId} sceneId 
     * @returns {Promise<boolean>}
     */
    remove: async function (sessionId, path, sceneId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const targetFolder = await getFolder(session.scenes, path)
        if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.folders.${targetFolder.path}.contents`]: sceneId } }).exec()
        else await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.contents`]: sceneId } }).exec()

        const scene = await sceneModel.findByIdAndDelete(sceneId).exec()
        if (!scene) throw new Error("Failed to remove scene")

        await networking.modifyFile(scene.image, -1)
        if (!session.state.scene) return false

        await sessionModel.findByIdAndUpdate(sessionId, { $set: { state: { "scene": null, "synced": false } } }).exec()
        return session.state.scene.equals(sceneId)
    },

    /**
     * Rename-scene handler
     * @param {ObjectId} sceneId 
     * @param {string} name
     * @returns {Promise<void>}
     */
    rename: async function (sceneId, name) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { "info.name": name } }).exec()
        if (!update) throw new Error("Failed to rename scene")
    },

    /**
     * Modify-grid handler
     * @param {ObjectId} sceneId 
     * @param {{}} data
     * @returns {Promise<void>}
     */
    modifyGrid: async function (sceneId, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { "grid": data } }).exec()
        if (!update) throw new Error("Failed to update database")
    },

    /**
     * Modify-lighting handler
     * @param {ObjectId} sceneId 
     * @param {{}} data
     * @returns {Promise<void>}
     */
    modifyLighting: async function (sceneId, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { "darkness": data } }).exec()
        if (!update) throw new Error("Failed to update database")
    },

    /**
     * Move-scene handler
     * @param {ObjectId} sessionId 
     * @param {ObjectId} sceneId 
     * @param {string} oldPath 
     * @param {string} newPath 
     * @returns {Promise<void>}
     */
    move: async function (sessionId, sceneId, oldPath, newPath) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const oldFolder = await getFolder(session.scenes, oldPath)

        let pull
        let push

        if (!oldPath) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.contents`]: sceneId } }).exec()
        else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`scenes.folders.${oldFolder.path}.contents`]: sceneId } }).exec()
        if (!pull) throw new Error("Failed to pull the scene from old location")

        const newState = await sessionModel.findById(sessionId).exec()
        const newFolder = await getFolder(newState.scenes, newPath)

        if (!newPath) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.contents`]: sceneId } }).exec()
        else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`scenes.folders.${newFolder.path}.contents`]: sceneId } }).exec()

        if (!push) throw new Error("Failed to push the scene to new location")
    },

    /**
     * Create-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} path 
     * @param {string} name 
     * @returns {Promise<string>}
     */
    createFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const id = new ObjectId().toString()
        const data = {
            name: name,
            folders: {},
            contents: []
        }

        const targetFolder = await getFolder(session.scenes, path)
        if (targetFolder) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${targetFolder.path}.folders.${id}`]: data } }).exec()
            if (!update) throw new Error("Failed to create folder")

            return id
        } else {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${id}`]: data } }).exec()
            if (!update) throw new Error("Failed to create folder")

            return id
        }
    },

    /**
     * Remove-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} path 
     * @returns {Promise<boolean>}
     */
    removeFolder: async function (sessionId, path) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const oldFolder = await getFolder(session.scenes, path)
        let requireUpdate = false
        for (let i = 0; i < oldFolder.contents.length; i++) {
            const currentDeleted = await module.exports.remove(sessionId, path, oldFolder.contents[i])
            if (currentDeleted) requireUpdate = true
        }

        const folders = Object.keys(oldFolder.folders)
        for (let i = 0; i < folders.length; i++) {
            const currentDeleted = await module.exports.removeFolder(sessionId, path + "/" + folders[i])
            if (currentDeleted) requireUpdate = true
        }

        let paths = path.split("/")
        const folderId = paths.pop()

        const targetFolder = await getFolder(session.scenes, paths.join("/"))
        if (targetFolder) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`scenes.folders.${targetFolder.path}.folders.${folderId}`]: "" } }).exec()
            if (!update) throw new Error("Failed to remove folder")
        } else {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`scenes.folders.${folderId}`]: "" } }).exec()
            if (!update) throw new Error("Failed to remove folder")
        }

        return requireUpdate
    },

    /**
     * Rename-folder handler
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {string} name
     * @returns {Promise<void>}
     */
    renameFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const targetFolder = await getFolder(session.scenes, path)
        if (!targetFolder) throw new Error("Target folder not found")

        const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${targetFolder.path}.name`]: name } }).exec()
        if (!update) throw new Error("Failed to rename folder")
    },

    /**
     * Move-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} oldPath 
     * @param {string} newPath 
     * @returns {Promise<void>}
     */
    moveFolder: async function (sessionId, oldPath, newPath) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        let oldPaths = oldPath.split("/")
        const oldId = oldPaths.pop()

        let pull
        let push

        const oldFolder = await getFolder(session.scenes, oldPaths.join("/"))
        if (oldFolder) pull = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`scenes.folders.${oldFolder.path}.folders.${oldId}`]: "" } }).exec()
        else pull = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`scenes.folders.${oldId}`]: "" } }).exec()
        if (!pull) throw new Error("Failed to pull the folder from old location")

        const newState = await sessionModel.findById(sessionId).exec()
        const newFolder = await getFolder(newState.scenes, newPath)
        if (newFolder) {
            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${newFolder.path}.folders.${oldId}`]: oldFolder.folders[oldId] } }).exec()
            else push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${newFolder.path}.folders.${oldId}`]: session.scenes.folders[oldId] } }).exec()
        } else {
            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${oldId}`]: oldFolder.folders[oldId] } }).exec()
            else push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`scenes.folders.${oldId}`]: session.scenes.folders[oldId] } }).exec()
        }
        if (!push) throw new Error("Failed to push the folder to new location")
    },

    /**
     * change-scene-image handler
     * @param {ObjectId} sceneId
     * @param {Buffer} buffer
     * @returns {Promise<string>}
    */
    changeImage: async function (sceneId, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const scene = await sceneModel.findById(sceneId).exec()
            if (!scene) throw new Error("Scene not found")

            await networking.modifyFile(scene.info.image, -1)
            const id = new ObjectId()
            await networking.uploadFile(id, buffer).then(null, (rejected) => reject(rejected))

            const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { "info.image": id } }).exec()
            if (!update) reject("Operation failed")

            resolve(id)
        })
    },
}