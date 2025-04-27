const { ObjectId } = require("mongodb")
const { modify } = require("../../modules/effects")
const { Server } = require("socket.io")

/**
 * Modify-effect packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} effectId
 * @param {{}} data
 * @param {Buffer} imageBuffer
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, effectId, data, imageBuffer, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-effect")
    try {
        const image = await modify(effectId, data, imageBuffer)
        data.image = image
        callback(true)
        socketServer.to(sessionId.toString()).emit("modify-effect", effectId, data)
    } catch (error) {
        console.error("Failed to modify effect", error)
        callback(false, error.message)
    }
}