const { ObjectId } = require("mongodb")
const { toggleLight } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Toggle-token-light packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {Boolean} enabled
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, enabled, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: toggle-token-light")
    try {
        await toggleLight(id, enabled)
        socketServer.to(sessionId.toString()).emit("toggle-token-light", id, enabled)
        socketServer.to(sessionId.toString()).emit("modify-blueprint", id)

        callback(true)
    } catch (error) {
        console.error("Failed to toggle light", error)
        callback(false, error.message)
    }
}