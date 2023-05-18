const { ObjectId } = require("mongodb")
const { join } = require("../../modules/session")

/**
 * Join-session packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo
 * @param {{ id: import("mongoose").ObjectId | null, master: import("mongoose").ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: import("mongoose").ObjectId | null, users: Array | null, background: import("mongoose").ObjectId | null }} sessionInfo
 * @param {import("socket.io").Socket} socket
 * @param {string} sessionId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, socket, sessionId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: join-session")
    try {
        const res = await join(ObjectId(sessionId), socket, accountInfo.username)

        sessionInfo.id = res._id
        sessionInfo.master = res.master
        sessionInfo.isMaster = res.master.equals(accountInfo.uid)
        sessionInfo.synced = res.state.synced
        sessionInfo.scene = res.state.scene
        sessionInfo.users = res.users
        sessionInfo.background = res.background

        console.log(`The user ${accountInfo.username} (${accountInfo.uid}) joined a session (${sessionInfo.id})`)
        callback(true)
    } catch (error) {
        console.error("Failed to join session", error)
        callback(error.message)
    }
}
