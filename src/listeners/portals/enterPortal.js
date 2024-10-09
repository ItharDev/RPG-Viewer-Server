const { ObjectId } = require("mongodb")
const { enter } = require("../../modules/portals")
const { Server } = require("socket.io")

/**
 * enteE-portal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {ObjectId} tokenId
 * @param {ObjectId} portalId
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, tokenId, portalId, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: enter-portal")
    try {
        const position = await enter(scene, tokenId, portalId)
        socketServer.to(sessionId.toString()).emit("enter-portal", tokenId, position)
        callback(true)
    } catch (error) {
        console.error("Failed to enter", error)
        callback(false, error.message)
    }
}
