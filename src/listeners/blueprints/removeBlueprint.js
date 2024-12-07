const { ObjectId } = require("mongodb")
const { remove, removeFolder } = require("../../modules/blueprint")

module.exports = {
    /**
     * Remove-blueprint packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {ObjectId} blueprintId
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    blueprint: async (accountInfo, sessionId, path, blueprintId, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-blueprint")
        try {
            await remove(sessionId, path, blueprintId)
            callback(true)
            if (path.includes("public")) socketServer.to(sessionId.toString()).emit("remove-blueprint", blueprintId)
        } catch (error) {
            console.error("Failed to remove blueprint", error)
            callback(false, error.message)
        }
    },

    /**
     * Remove-blueprint-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-blueprint-folder")
        try {
            await removeFolder(sessionId, path)
            callback(true)
        } catch (error) {
            console.error("Failed to remove folder", error)
            callback(false, error.message)
        }
    }
}