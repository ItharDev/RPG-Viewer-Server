const { ObjectId } = require("mongodb")
const { remove, removeFolder } = require("../../modules/scene")

module.exports = {
    /**
     * Remove-scene packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {ObjectId} sceneId
     * @param {() => {}} callback
    */
    scene: async (accountInfo, sessionId, path, sceneId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-scene")
        try {
            const requireUpdate = await remove(sessionId, path, sceneId)
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
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-scene-folder")
        try {
            await removeFolder(sessionId, path)
            callback(true)
        } catch (error) {
            console.error("Failed to remove folder", error)
            callback(false, error.message)
        }
    }
}