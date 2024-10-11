const { Server, Socket } = require("socket.io")
const { ObjectId } = require("mongodb")

/**
 * leave-session packet listener
 * @param {{ uid: .ObjectId, username: string }} accountInfo
 * @param {{ id: ObjectId | null, master: ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: ObjectId | null, users: Array | null, background: ObjectId | null }} sessionInfo
 * @param {Socket} socket
 * @param {Server} socketServer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, socket, socketServer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: leave-session")
    try {
        if (!socket.rooms.has(sessionInfo.id.toString())) throw new Error("Client not connected to any game session")

        socket.to(sessionInfo.id.toString()).emit("user-disconnected", username)
        socket.leave(sessionInfo.id.toString())
        if (sessionInfo.isMaster) {
            socketServer.to(sessionInfo.id.toString()).emit("set-state", "", false)
        }

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
        callback(false, error.message)
    }
}
