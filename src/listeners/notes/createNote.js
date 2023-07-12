const { ObjectId } = require("mongodb")
const { create } = require("../../modules/notes")
const { noteModel } = require("../../schemas")
const { Server } = require("socket.io")

/**
 * Create-note packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {{}} data
 * @param {{}} info
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, data, info, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-note")
    try {
        const model = new noteModel(data)
        if (!info.id) info.id = model._id
        const id = await create(sceneId, model, info)

        socketServer.to(sessionId.toString()).emit("create-note", id, info, data)
        callback(true)
    } catch (error) {
        console.error("Failed to create note", error)
        callback(false, error.message)
    }
}