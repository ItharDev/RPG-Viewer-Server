const { ObjectId } = require("mongodb")
const { modify } = require("../../modules/initiatives.js")
const { Server } = require("socket.io")

/**
 * Modify-initiative packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {string} id
 * @param {{name: String, Roll: number, Visible: boolean}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-initiative")
    try {
        await modify(scene, id, data)
        socketServer.to(sessionId.toString()).emit("modify-initiative", data)
        callback(true)
    } catch (error) {
        console.error("Failed to modify initiative", error)
        callback(false, error.message)
    }
}
