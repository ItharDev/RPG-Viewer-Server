const { ObjectId } = require("mongodb")
const { setConditions } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Update-conditions packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {Number} conditions
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, conditions, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: update-conditions")
    try {
        await setConditions(id, conditions)
        socketServer.to(sessionId.toString()).emit("update-conditions", id, conditions)

        callback(true)
    } catch (error) {
        console.error("Failed to update conditions", error)
        callback(false, error.message)
    }
}