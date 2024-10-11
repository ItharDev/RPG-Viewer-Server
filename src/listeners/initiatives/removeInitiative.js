const { ObjectId } = require("mongodb")
const { remove } = require("../../modules/initiatives.js")
const { Server } = require("socket.io")

/**
 * Remove-initiative packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {string} id
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-initiative")
    try {
        await remove(scene, id)
        socketServer.to(sessionId.toString()).emit("remove-initiative", id)
        callback(true)
    } catch (error) {
        console.error("Failed to remove initiative", error)
        callback(false, error.message)
    }
}
