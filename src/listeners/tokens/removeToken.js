const { ObjectId } = require("mongodb")
const { remove } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Remove-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {ObjectId} tokenId
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, tokenId, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-token")
    try {
        await remove(sceneId, tokenId)
        socketServer.to(sessionId.toString()).emit("remove-token", tokenId)

        callback(true)
    } catch (error) {
        console.error("Failed to remove blueprint", error)
        callback(false, error.message)
    }
}