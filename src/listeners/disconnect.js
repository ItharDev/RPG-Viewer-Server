const session = require("../modules/session")

/**
 * Disconnect packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {{ id: import("mongoose").ObjectId | null, master: import("mongoose").ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: import("mongoose").ObjectId | null, users: Array | null, background: import("mongoose").ObjectId | null }} sessionInfo
 * @param {import("socket.io").Server} socketServer
 */
module.exports = async (accountInfo, sessionInfo, socketServer) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: disconnect")
    try {
        if (!sessionInfo.id || !sessionInfo.isMaster) return

        await session.sync(sessionInfo.id, false)
        await session.set(sessionInfo.id, undefined)
        socketServer.to(sessionInfo.id.toString()).emit("change-state", false, "")
        console.log(`${accountInfo.username} (${accountInfo.uid}) disconnected.`)
    } catch (error) {
        console.error("Failed to disconnect a session", error)
    }
}
