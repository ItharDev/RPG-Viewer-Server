const { ObjectId } = require("mongodb")
const { create } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Create-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {string} position
 * @param {number} radius
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, position, radius, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-portal")
    try {
        const data = await create(scene, JSON.parse(position), radius)
        socketServer.to(sessionId.toString()).emit("create-portal", data.id, data)
        callback(true)
    } catch (error) {
        console.error("Failed to create portal", error)
        callback(false, error.message)
    }
}
