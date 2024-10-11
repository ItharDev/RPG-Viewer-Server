const { ObjectId } = require("mongodb")
const { remove } = require("../../modules/notes")
const { Server } = require("socket.io")

/**
 * Remove-note packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {ObjectId} noteId
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, noteId, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-note")
    try {
        remove(sceneId, noteId)
        socketServer.to(sessionId.toString()).emit("remove-note", noteId)
        callback(true)
    } catch (error) {
        console.error("Failed to remove note", error)
        callback(false, error.message)
    }
}