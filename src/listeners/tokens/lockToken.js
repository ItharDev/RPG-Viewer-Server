const { ObjectId } = require("mongodb")
const { lock } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Lock-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {boolean} toggle
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, toggle, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: lock-token")
    try {
        await lock(id, toggle)
        socketServer.to(sessionId.toString()).emit("lock-token", id, toggle)

        callback(true)
    } catch (error) {
        console.error("Failed to lock token", error)
        callback(false, error.message)
    }
}