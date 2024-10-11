const { ObjectId } = require("mongodb")
const { move } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Move-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {string} position
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, position, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-portal")
    try {
        await move(scene, id, JSON.parse(position))
        socketServer.to(sessionId.toString()).emit("move-portal", id, position)
        callback(true)
    } catch (error) {
        console.error("Failed to move portal", error)
        callback(false, error.message)
    }
}
