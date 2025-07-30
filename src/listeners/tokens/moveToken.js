const { ObjectId } = require("mongodb")
const { move } = require("../../modules/token")
const { Server } = require("socket.io")
const { gameStates } = require("../../server")

/**
 * Move-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {{ isMaster: boolean }} sessionInfo
 * @param {ObjectId} sessionId
 * @param {{}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, sessionId, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-token")
    if (gameStates[sessionId.toString()]?.paused && !sessionInfo.isMaster) {
        return callback(false, "Game is paused")
    }

    try {
        await move(ObjectId(data.id), data.points[data.points.length - 1])
        socketServer.to(sessionId.toString()).emit("move-token", data.id, data)
        callback(true)
    } catch (error) {
        console.error("Failed to move token", error)
        callback(false, error.message)
    }
}