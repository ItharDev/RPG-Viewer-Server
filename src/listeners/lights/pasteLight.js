const { ObjectId } = require("mongodb")
const { paste } = require("../../modules/lights")
const { Server } = require("socket.io")

/**
 * Create-light packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {{}} info
 * @param {boolean} usePreset
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, info, usePreset, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: paste-light")
    try {
        const output = await paste(sceneId, info, usePreset)

        socketServer.to(sessionId.toString()).emit("create-light", output.id, output.info, output.data)
        callback(true)
    } catch (error) {
        console.error("Failed to create light", error)
        callback(false, error.message)
    }
}