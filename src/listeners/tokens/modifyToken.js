const { ObjectId } = require("mongodb")
const { modify } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Modify-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {{}} tokenData
 * @param {{}} lightingData
 * @param {Buffer} imageBuffer
 * @param {Buffer} artBuffer
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, tokenData, lightingData, imageBuffer, artBuffer, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-token")
    try {
        const image = await modify(sessionId, id, tokenData, lightingData, imageBuffer, artBuffer)
        tokenData.image = image.image
        tokenData.art = image.art
        socketServer.to(sessionId.toString()).emit("modify-token", id, tokenData)

        callback(true)
    } catch (error) {
        console.error("Failed to modify token", error)
        callback(false, error.message)
    }
}