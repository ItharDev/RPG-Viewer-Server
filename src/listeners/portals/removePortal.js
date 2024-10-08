const { ObjectId } = require("mongodb")
const { remove } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Remove-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-portal")
    try {
        await remove(scene, id)
        socketServer.to(sessionId.toString()).emit("remove-portal", id)
        callback(true)
    } catch (error) {
        console.error("Failed to remove portal", error)
        callback(false, error.message)
    }
}
