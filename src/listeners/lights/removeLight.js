const { ObjectId } = require("mongodb")
const { remove, removePreset } = require("../../modules/lights")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Remove-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    light: async (accountInfo, sceneId, lightId, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-light")
        try {
            remove(sceneId, lightId)
            socketServer.emit("remove-light", id)
            callback(true)
        } catch (error) {
            console.error("Failed to remove light", error)
            callback(false, error.message)
        }
    },

    /**
     * Remove-preset packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} lightId
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    preset: async (accountInfo, sessionId, lightId, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-preset")
        try {
            await removePreset(sessionId, lightId)
            callback(true)
            socketServer.emit("remove-preset", lightId)
        } catch (error) {
            console.error("Failed to remove preset", error)
            callback(false, error.message)
        }
    }
}