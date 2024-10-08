const { ObjectId } = require("mongodb")
const { setContinuous } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Set-portal-continuous packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {boolean} state
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, state, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: set-portal-continuous")
    try {
        await setContinuous(scene, id, state)
        socketServer.to(sessionId.toString()).emit("set-portal-continuous", id, state)
        callback(true)
    } catch (error) {
        console.error("Failed to update portal state", error)
        callback(false, error.message)
    }
}
