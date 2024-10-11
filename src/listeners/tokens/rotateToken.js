const { ObjectId } = require("mongodb")
const { setRotation } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Rotate-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {Number} angle
 * @param {ObjectId} user
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, angle, user, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: rotate-token")
    try {
        await setRotation(id, angle)
        socketServer.to(sessionId.toString()).emit("rotate-token", id, angle, user)

        callback(true)
    } catch (error) {
        console.error("Failed to rotate token", error)
        callback(false, error.message)
    }
}