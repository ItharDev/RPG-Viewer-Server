const { ObjectId } = require("mongodb")
const { reset } = require("../../modules/initiatives.js")
const { Server } = require("socket.io")

/**
 * Reset-initiatives packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: reset-initiatives")
    try {
        await reset(scene)
        socketServer.to(sessionId.toString()).emit("reset-initiatives")
        callback(true)
    } catch (error) {
        console.error("Failed to reset initiatives", error)
        callback(false, error.message)
    }
}
