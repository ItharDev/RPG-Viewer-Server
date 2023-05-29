const { ObjectId } = require("mongodb")
const { rename, renameFolder } = require("../../modules/scene")

module.exports = {
    /**
     * Rename-scene packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {string} name
     * @param {() => {}} callback
    */
    scene: async (accountInfo, sceneId, name, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: rename-scene")
        try {
            await rename(sceneId, name)
            callback(true)
        } catch (error) {
            console.error("Failed to rename scene", error)
            callback(false, error.message)
        }
    },

    /**
     * Rename-scene-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {string} name
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, name, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: rename-scene-folder")
        try {
            await renameFolder(sessionId, path, name)
            callback(true)
        } catch (error) {
            console.error("Failed to rename folder", error)
            callback(false, error.message)
        }
    }
}