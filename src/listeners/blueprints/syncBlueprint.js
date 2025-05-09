const { ObjectId } = require("mongodb")
const { sync } = require("../../modules/blueprint")

/**
 * Sync-blueprint packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {boolean} synced
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, synced, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: sync-blueprint")
    try {
        await sync(sessionId, id, synced)
        socketServer.to(sessionId.toString()).emit("sync-blueprint", id, synced)
        callback(true)
    } catch (error) {
        console.error("Failed to modify blueprint", error)
        callback(false, error.message)
    }
}