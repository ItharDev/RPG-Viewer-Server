const { ObjectId } = require("mongodb")
const { create, createPreset } = require("../../modules/lights")
const { lightModel } = require("../../schemas")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Create-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {{name: String, radius: Number, intensity: Number, enabled: Boolean, color: {}, position: {}, effect: {}}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    light: async (accountInfo, sceneId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-light")
        try {
            const model = new lightModel(data)

            const id = await create(sceneId, model)
            socketServer.emit("create-light", id, model)
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
     * @param {{name: String, radius: Number, intensity: Number, enabled: Boolean, color: {}, position: {}, effect: {}}} data
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