const { ObjectId } = require("mongodb")
const { activate } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Activate-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {boolean} state
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, state, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: activate-portal")
    try {
        await activate(scene, id, state)
        socketServer.to(sessionId.toString()).emit("activate-portal", id, state)
        callback(true)
    } catch (error) {
        console.error("Failed to toggle portal", error)
        callback(false, error.message)
    }
}
