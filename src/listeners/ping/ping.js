const { ObjectId } = require("mongodb")
const { Server } = require("socket.io")

/**
 * Ping packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {string} location
 * @param {Server} socketServer
*/
module.exports = (accountInfo, sessionId, location, socketServer) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: ping")
    socketServer.to(sessionId.toString()).emit("ping", accountInfo.uid, location)
}
