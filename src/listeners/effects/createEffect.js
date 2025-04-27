const { ObjectId } = require("mongodb")
const { create } = require("../../modules/effects")
const { Server } = require("socket.io")
const { effectModel } = require("../../schemas")

/**
     * Create-effect packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {{}} data
     * @param {Buffer} imageBuffer
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
module.exports = async (accountInfo, sessionId, data, imageBuffer, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-effect")
    try {
        data.image = new ObjectId()
        const model = new effectModel(data)

        const id = await create(sessionId, model, imageBuffer)
        callback(true)
        socketServer.emit("create-effect", id, model)
    } catch (error) {
        console.error("Failed to create effect", error)
        callback(false, error.message)
    }
}