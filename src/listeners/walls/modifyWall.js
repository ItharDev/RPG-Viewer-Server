const { ObjectId } = require("mongodb")
const { modify } = require("../../modules/walls")
const { Server } = require("socket.io")

/**
 * Modify-wall packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {{wallId: ObjectId, points: Array<{x: number, y: number}>, model: number, open: boolean, locked: boolean}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-wall")
    try {
        await modify(scene, data)
        socketServer.to(sessionId.toString()).emit("modify-wall", data)
        callback(true)
    } catch (error) {
        console.error("Failed to modify wall", error)
        callback(false, error.message)
    }
}
