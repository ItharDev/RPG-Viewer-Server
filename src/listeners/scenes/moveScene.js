const { ObjectId } = require("mongodb")
const { move, moveFolder } = require("../../modules/scene")

module.exports = {
    /**
     * Move-scene packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {string} oldPath
     * @param {string} newPath
     * @param {() => {}} callback
    */
    scene: async (accountInfo, sessionId, sceneId, oldPath, newPath, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-scene")
        try {
            await move(sessionId, sceneId, oldPath, newPath)
            callback(true)
        } catch (error) {
            console.error("Failed to move scene", error)
            callback(false, error.message)
        }
    },

    /**
     * Move-scene-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} oldPath
     * @param {string} newPath
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, oldPath, newPath, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-scene-folder")
        try {
            await moveFolder(sessionId, oldPath, newPath)
            callback(true)
        } catch (error) {
            console.error("Failed to move folder", error)
            callback(false, error.message)
        }
    }
}