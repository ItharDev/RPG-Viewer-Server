const { ObjectId } = require("mongodb")
const { move } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Move-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {{}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-token")
    try {
        await move(ObjectId(data.id), data.points[data.points.length - 1])
        socketServer.to(sessionId.toString()).emit("move-token", data.id, data)
        callback(true)
    } catch (error) {
        console.error("Failed to move token", error)
        callback(false, error.message)
    }
}