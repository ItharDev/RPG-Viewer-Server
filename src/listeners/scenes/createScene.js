const { ObjectId } = require("mongodb")
const { create, createFolder } = require("../../modules/scene")
const { sceneModel } = require("../../schemas")

module.exports = {
    /**
     * Create-scene packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {{info: {}, darkness: {}, grid: {}, walls: Array<{}>, tokens: Array<ObjectId>, initiatives: {}, lights: {}, notes: {}}} data
     * @param {() => {}} callback
    */
    scene: async (accountInfo, sessionId, path, data, buffer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-scene")
        try {
            data.info.image = new ObjectId()
            const model = new sceneModel(data)

            const id = await create(sessionId, path, model, buffer)
            callback(true, id, data.info.image)
        } catch (error) {
            console.error("Failed to create scene", error)
            callback(false, error.message)
        }
    },

    /**
     * Create-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {string} name
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, name, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-scene-folder")
        try {
            const id = await createFolder(sessionId, path, name)
            callback(true, id)
        } catch (error) {
            console.error("Failed to create folder", error)
            callback(false, error.message)
        }
    }
}