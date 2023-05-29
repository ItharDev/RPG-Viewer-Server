const { ObjectId } = require("mongodb")
const { join } = require("../../modules/session")
const { Socket } = require("socket.io")

/**
 * Join-session packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {{ id: ObjectId | null, master: ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: ObjectId | null, users: Array | null, background: ObjectId | null }} sessionInfo
 * @param {Socket} socket
 * @param {string} sessionId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, socket, sessionId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: join-session")
    try {
        const model = await join(ObjectId(sessionId), socket, accountInfo.username)

        sessionInfo.id = model._id
        sessionInfo.master = model.master
        sessionInfo.isMaster = model.master.equals(accountInfo.uid)
        sessionInfo.synced = model.state.synced
        sessionInfo.scene = model.state.scene
        sessionInfo.users = model.users
        sessionInfo.background = model.background

        socket.join(sessionId.toString())
        socket.to(sessionId.toString()).emit("user-connected", accountInfo.username)

        callback(true, sessionInfo)
    } catch (error) {
        console.error("Failed to join session", error)
        callback(false, error.message)
    }
}
