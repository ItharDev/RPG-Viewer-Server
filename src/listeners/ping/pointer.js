const { ObjectId } = require("mongodb")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Start-pointer packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} location
     * @param {Server} socketServer
    */
    start: (accountInfo, sessionId, location, socketServer) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: start-pointer")
        socketServer.to(sessionId.toString()).emit("start-pointer", accountInfo.uid, location)
    },

    /**
     * Update-pointer packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} location
     * @param {Server} socketServer
    */
    update: (accountInfo, sessionId, location, socketServer) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: update-pointer")
        socketServer.to(sessionId.toString()).emit("update-pointer", accountInfo.uid, location)
    },

    /**
     * Stop-pointer packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {Server} socketServer
    */
    stop: (accountInfo, sessionId, socketServer) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: stop-pointer")
        socketServer.to(sessionId.toString()).emit("stop-pointer", accountInfo.uid)
    }
}