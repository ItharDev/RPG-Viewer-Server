const { ObjectId } = require("mongodb")
const { modifyGrid } = require("../../modules/scene")
const { Server } = require("socket.io")

/**
 * Modify-grid packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {{}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-grid")
    try {
        await modifyGrid(sceneId, data)
        socketServer.to(sessionId.toString()).emit("modify-grid", data)
        callback(true)
    } catch (error) {
        console.error("Failed to update grid", error)
        callback(false, error.message)
    }
}