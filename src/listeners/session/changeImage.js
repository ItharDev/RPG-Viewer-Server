const { ObjectId } = require("mongodb")
const { changeImage } = require("../../modules/session")
const { Server } = require("socket.io")

/**
 * Change-landing-page packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {Buffer} buffer
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, buffer, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: change-landing-page")
    try {
        const id = await changeImage(sessionId, buffer)
        callback(true)
        socketServer.to(sessionId.toString()).emit("change-landing-page", id)
    } catch (error) {
        console.error("Failed to update landing page", error)
        callback(false, error.message)
    }
}
