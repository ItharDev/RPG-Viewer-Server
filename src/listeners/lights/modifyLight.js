const { ObjectId } = require("mongodb")
const { modify, modifyPreset, move, toggle } = require("../../modules/lights")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Modify-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} lightId
     * @param {{}} info
     * @param {{}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    light: async (accountInfo, sessionId, sceneId, lightId, info, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-light")
        try {
            await modify(sessionId, sceneId, lightId, info, data)
            socketServer.to(sessionId.toString()).emit("modify-light", lightId, info, data)
            callback(true)
        } catch (error) {
            console.error("Failed to modify light", error)
            callback(false, error.message)
        }
    },

    /**
     * Move-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {{}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    move: async (accountInfo, sessionId, sceneId, lightId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-light")
        try {
            await move(sceneId, lightId, data)
            socketServer.to(sessionId.toString()).emit("move-light", lightId, data)
            callback(true)
        } catch (error) {
            console.error("Failed to move light", error)
            callback(false, error.message)
        }
    },

    /**
     * Toggle-light packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {boolean} enabled
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    toggle: async (accountInfo, sessionId, sceneId, lightId, enabled, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: toggle-light")
        try {
            await toggle(sceneId, lightId, enabled)
            socketServer.to(sessionId.toString()).emit("toggle-light", lightId, enabled)
            callback(true)
        } catch (error) {
            console.error("Failed to toggle light", error)
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