const { ObjectId } = require("mongodb")
const { remove } = require("../../modules/walls")
const { Server } = require("socket.io")

/**
 * Remove-wall packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-wall")
    try {
        await remove(scene, id)
        socketServer.to(sessionId.toString()).emit("remove-wall", id)
        callback(true)
    } catch (error) {
        console.error("Failed to remove wall", error)
        callback(false, error.message)
    }
}
