const { ObjectId } = require("mongodb")
const { create } = require("../../modules/walls")
const { Server } = require("socket.io")

/**
 * Create-wall packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} scene
 * @param {{id: ObjectId, points: Array<{x: number, y: number}>, type: number, open: boolean, locked: boolean}} data
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, data, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-wall")
    try {
        data.id = new ObjectId()
        await create(scene, data)
        socketServer.to(sessionId.toString()).emit("create-wall", data)
        callback(true)
    } catch (error) {
        console.error("Failed to create wall", error)
        callback(false, error.message)
    }
}
