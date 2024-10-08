const { ObjectId } = require("mongodb")
const { create } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Create-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {{x: number, y: number}} position
 * @param {number} radius
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, position, radius, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-portal")
    try {
        const data = await create(scene, position, radius)
        socketServer.to(sessionId.toString()).emit("create-portal", data)
        callback(true, data.id)
    } catch (error) {
        console.error("Failed to create portal", error)
        callback(false, error.message)
    }
}
