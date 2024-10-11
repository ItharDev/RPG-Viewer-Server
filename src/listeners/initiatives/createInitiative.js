const { ObjectId } = require("mongodb")
const { create } = require("../../modules/initiatives.js")
const { Server } = require("socket.io")

/**
 * Create-initiative packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {{name: String, Roll: number, Visible: boolean}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-initiative")
    try {
        const id = await create(scene, data)
        data.id = id
        socketServer.to(sessionId.toString()).emit("create-initiative", data)
        callback(true)
    } catch (error) {
        console.error("Failed to create initiative", error)
        callback(false, error.message)
    }
}
