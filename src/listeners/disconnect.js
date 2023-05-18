const { ObjectId } = require("mongodb")
const { setState } = require("../modules/session")
const { Server } = require("socket.io")

/**
 * Disconnect packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {{ id: ObjectId | null, master: ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: ObjectId | null, users: Array | null, background: ObjectId | null }} sessionInfo
 * @param {Server} socketServer
 */
module.exports = async (accountInfo, sessionInfo, socketServer) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: disconnect")
    try {
        if (!sessionInfo.id || !sessionInfo.isMaster) return

        const state = {
            scene: undefined,
            synced: false
        }
        await setState(sessionInfo.id, state)
        socketServer.to(sessionInfo.id.toString()).emit("change-state", "", false)

        sessionInfo.id = null
        sessionInfo.master = null
        sessionInfo.isMaster = null
        sessionInfo.synced = null
        sessionInfo.scene = null
        sessionInfo.users = null
        sessionInfo.background = null

    } catch (error) {
        console.error("Failed to disconnect a session", error)
    }
}
