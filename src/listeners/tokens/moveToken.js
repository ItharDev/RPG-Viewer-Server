const { ObjectId } = require("mongodb")
const { move } = require("../../modules/token")
const { Server } = require("socket.io")
const { getGameState } = require("../../gameStates")

/**
 * Move-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {{ isMaster: boolean, id: string }} sessionInfo
 * @param {ObjectId} sessionId
 * @param {{}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-token")
    try {
        if (getGameState(sessionInfo.id)?.isPaused && !sessionInfo.isMaster) {
            return callback(false, "Game is paused")
        }

        await move(ObjectId(data.id), data.points[data.points.length - 1])
        socketServer.to(sessionInfo.id.toString()).emit("move-token", data.id, data)
        callback(true)
    } catch (error) {
        console.error("Failed to move token", error)
        callback(false, error.message)
    }
}