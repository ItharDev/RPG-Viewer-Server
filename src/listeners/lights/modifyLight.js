const { ObjectId } = require("mongodb")
const { modify, modifyPreset } = require("../../modules/lights")
const { lightModel } = require("../../schemas")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Modify-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {{}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    light: async (accountInfo, sessionId, sceneId, lightId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-light")
        try {
            await modify(lightId, data)
            socketServer.to(sessionId.toString()).emit("modify-light", lightId, data)
            callback(true)
        } catch (error) {
            console.error("Failed to modify light", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-preset packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} lightId
     * @param {{}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    preset: async (accountInfo, sessionId, lightId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-preset")
        try {
            await modifyPreset(lightId, data)
            callback(true)
            socketServer.to(sessionId.toString()).emit("modify-preset", lightId, model)
        } catch (error) {
            console.error("Failed to modify preset", error)
            callback(false, error.message)
        }
    }
}