const { ObjectId } = require("mongodb")
const { setHealth } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Update-health packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {boolean} value
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, value, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: update-health")
    try {
        await setHealth(id, value)
        socketServer.to(sessionId.toString()).emit("update-health", id, value)

        callback(true)
    } catch (error) {
        console.error("Failed to update health", error)
        callback(false, error.message)
    }
}