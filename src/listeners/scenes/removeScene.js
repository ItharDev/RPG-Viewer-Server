const { ObjectId } = require("mongodb")
const { remove, removeFolder } = require("../../modules/scene")

module.exports = {
    /**
     * Remove-scene packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {ObjectId} sceneId
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    scene: async (accountInfo, sessionId, path, sceneId, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-scene")
        try {
            const requireUpdate = await remove(sessionId, path, sceneId)
            if (requireUpdate) socketServer.to(sessionId.toString()).emit("set-state", "", false)
            callback(true)
        } catch (error) {
            console.error("Failed to remove scene", error)
            callback(false, error.message)
        }
    },

    /**
     * Remove-scene-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-scene-folder")
        try {
            const requireUpdate = await removeFolder(sessionId, path)
            if (requireUpdate) socketServer.to(sessionId.toString()).emit("set-state", "", false)
            callback(true)
        } catch (error) {
            console.error("Failed to remove folder", error)
            callback(false, error.message)
        }
    }
}