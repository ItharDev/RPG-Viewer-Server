const { ObjectId } = require("mongodb")
const { modify } = require("../../modules/blueprint")

/**
 * Modify-blueprint packet listener
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
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-blueprint")
    try {
        const { image, art, token } = await modify(sessionId, id, tokenData, lightingData, imageBuffer, artBuffer)
        callback(true, image, art)
        socketServer.to(sessionId.toString()).emit("modify-blueprint", id)
        socketServer.to(sessionId.toString()).emit("modify-token", id, token)
    } catch (error) {
        console.error("Failed to modify blueprint", error)
        callback(false, error.message)
    }
}