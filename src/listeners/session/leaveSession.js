const session = require("../../modules/session")
const { leave } = require("../../modules/session")

/**
 * leave-session packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {{ id: import("mongoose").ObjectId | null, master: import("mongoose").ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: import("mongoose").ObjectId | null, users: Array | null, background: import("mongoose").ObjectId | null }} sessionInfo
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, socket, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: leave-session")
    try {
        await leave(socket, sessionInfo.id, accountInfo.username)
        if (sessionInfo.master) {
            await session.sync(sessionInfo.id, false)
            await session.set(sessionInfo.id, undefined)
            socketServer.to(sessionInfo.id.toString()).emit("change-state", false, "")
        }

        console.log(`The user ${accountInfo.username} (${accountInfo.uid}) left a session (${sessionInfo.id})`)

        sessionInfo.id = null
        sessionInfo.master = null
        sessionInfo.isMaster = null
        sessionInfo.synced = null
        sessionInfo.scene = null
        sessionInfo.users = null
        sessionInfo.background = null

        callback(true)
    } catch (error) {
        console.error("Failed to leave session", error)
        callback(error.message)
    }
}
