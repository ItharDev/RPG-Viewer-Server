const { ObjectId } = require("mongodb")
const { link } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * Link-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} source
 * @param {ObjectId} destination
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, source, destination, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: link-portal")
    try {
        await link(scene, source, destination)
        socketServer.to(sessionId.toString()).emit("link-portal", source, destination)
        callback(true)
    } catch (error) {
        console.error("Failed to link portals", error)
        callback(false, error.message)
    }
}
