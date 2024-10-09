const { ObjectId } = require("mongodb")
const {  modify } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Modify-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} id
 * @param {{}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, id, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-portal")
    try {
        data.id = id
        await modify(scene, id, data)
        socketServer.to(sessionId.toString()).emit("modify-portal", id, data)
        callback(true)
    } catch (error) {
        console.error("Failed to modify portal", error)
        callback(false, error.message)
    }
}
