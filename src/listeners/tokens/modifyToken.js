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
 * @param {Buffer} buffer
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, tokenData, lightingData, buffer, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-token")
    try {
        const image = await modify(id, tokenData, lightingData, buffer)
        tokenData.image = image
        socketServer.to(sessionId.toString()).emit("modify-token", id, tokenData)

        callback(true)
    } catch (error) {
        console.error("Failed to modify token", error)
        callback(false, error.message)
    }
}