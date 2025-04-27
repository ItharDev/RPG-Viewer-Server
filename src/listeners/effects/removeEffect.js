const { ObjectId } = require("mongodb")
const { remove } = require("../../modules/effects")
const { Server } = require("socket.io")

/**
 * Remove-effect packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} effectId
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, effectId, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-effect")
    try {
        const data = await remove(sessionId, effectId)
        callback(true)
        socketServer.to(sessionId.toString()).emit("remove-effect", effectId, data)
    } catch (error) {
        console.error("Failed to remove effect", error)
        callback(false, error.message)
    }
}