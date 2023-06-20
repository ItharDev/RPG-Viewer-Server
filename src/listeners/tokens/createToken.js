const { ObjectId } = require("mongodb")
const { create } = require("../../modules/token")
const { tokenModel, lightModel } = require("../../schemas")
const { Server } = require("socket.io")

/**
 * Create-token packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} sceneId
 * @param {{}} tokenData
 * @param {{}} lightingData
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, sceneId, tokenData, lightingData, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-token")
    try {
        const model = new tokenModel(tokenData)
        const lighting = new lightModel(lightingData)
        lighting._id = model._id
        if (!tokenData.light) tokenData.light = model._id

        const id = await create(sceneId, model, lighting)
        socketServer.to(sessionId.toString()).emit("create-token", id, tokenData)

        callback(true)
    } catch (error) {
        console.error("Failed to create token", error)
        callback(false, error.message)
    }
}