const { ObjectId } = require("mongodb")
const { create, createPreset } = require("../../modules/lights")
const { lightModel } = require("../../schemas")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Create-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {{}} data
     * @param {{}} info
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    light: async (accountInfo, sessionId, sceneId, data, info, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-light")
        try {
            const model = new lightModel(data)
            info.id = model.id
            const id = await create(sceneId, model, info)

            socketServer.to(sessionId.toString()).emit("create-light", id, info, data)
            callback(true)
        } catch (error) {
            console.error("Failed to create light", error)
            callback(false, error.message)
        }
    },

    /**
     * Create-preset packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {{name: String, radius: Number, enabled: Boolean, color: {}, position: {}, effect: {}}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    preset: async (accountInfo, sessionId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-preset")
        try {
            const model = new lightModel(data)

            const id = await createPreset(sessionId, model)
            callback(true)
            socketServer.emit("create-preset", id, model)
        } catch (error) {
            console.error("Failed to create preset", error)
            callback(false, error.message)
        }
    }
}