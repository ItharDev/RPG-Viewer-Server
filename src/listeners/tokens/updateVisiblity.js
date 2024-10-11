const { ObjectId } = require("mongodb")
const { setVisibility } = require("../../modules/token")
const { Server } = require("socket.io")

/**
 * Update-visibility packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {boolean} toggle
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, toggle, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: update-visibility")
    try {
        await setVisibility(id, toggle)
        socketServer.to(sessionId.toString()).emit("update-visibility", id, toggle)

        callback(true)
    } catch (error) {
        console.error("Failed to update visibility", error)
        callback(false, error.message)
    }
}