const { ObjectId } = require("mongodb")
const { setElevation } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Update-elevation packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {boolean} value
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, value, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: update-elevation")
    try {
        await setElevation(id, value)
        socketServer.to(sessionId.toString()).emit("update-elevation", id, value)

        callback(true)
    } catch (error) {
        console.error("Failed to update elevation", error)
        callback(false, error.message)
    }
}