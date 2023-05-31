const { ObjectId } = require("mongodb")
const { modify, modifyPreset } = require("../../modules/lights")
const { lightModel } = require("../../schemas")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Modify-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {{name: String, radius: Number, intensity: Number, enabled: Boolean, color: {}, position: {}, effect: {}}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    light: async (accountInfo, sceneId, lightId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-light")
        try {
            const model = new lightModel(data)
            model._id = lightId

            await modify(sceneId, model)
            socketServer.emit("modify-light", lightId, data)
            callback(true)
        } catch (error) {
            console.error("Failed to modify light", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-preset packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} lightId
     * @param {{name: String, radius: Number, intensity: Number, enabled: Boolean, color: {}, position: {}, effect: {}}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    preset: async (accountInfo, lightId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-preset")
        try {
            const model = new lightModel(data)
            model._id = lightId

            await modifyPreset(lightId, model)
            callback(true)
            socketServer.emit("modify-preset", lightId, model)
        } catch (error) {
            console.error("Failed to modify preset", error)
            callback(false, error.message)
        }
    }
}