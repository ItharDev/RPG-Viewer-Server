const { ObjectId } = require("mongodb")
const { setState } = require("../../modules/session")
const { Server } = require("socket.io")

/**
 * Set-state packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId | null} scene
 * @param {boolean} synced
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, scene, synced, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: set-state")
    try {
        const state = {
            scene: scene,
            synced: synced
        }

        await setState(sessionId, state)
        socketServer.to(sessionId.toString()).emit("change-state", state.scene, state.synced)
        callback(true)
    } catch (error) {
        console.error("Failed to create session", error)
        callback(error.message)
    }
}
