const { ObjectId } = require("mongodb")
const { changeImage } = require("../../modules/scene")
const { Server } = require("socket.io")

/**
 * Change-image packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {Buffer} buffer
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, buffer, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: change-scene-image")
    try {
        const id = await changeImage(sceneId, buffer)
        callback(true)
        socketServer.to(sessionId.toString()).emit("change-scene-image", id)
    } catch (error) {
        console.error("Failed to update scene image", error)
        callback(false, error.message)
    }
}
