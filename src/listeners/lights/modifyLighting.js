const { ObjectId } = require("mongodb")
const { modifyLighting } = require("../../modules/scene")
const { Server } = require("socket.io")

/**
 * Modify-lighting packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {{}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-lighting")
    try {
        await modifyLighting(sceneId, data)
        socketServer.to(sessionId.toString()).emit("modify-lighting", data)
        callback(true)
    } catch (error) {
        console.error("Failed to update lighting", error)
        callback(false, error.message)
    }
}