const { ObjectId } = require("mongodb")
const { setRadius } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Set-portal-radius packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {number} radius
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, radius, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: set-portal-radius")
    try {
        await setRadius(scene, id, radius)
        socketServer.to(sessionId.toString()).emit("set-portal-radius", id, radius)
        callback(true)
    } catch (error) {
        console.error("Failed to update portal radius", error)
        callback(false, error.message)
    }
}
