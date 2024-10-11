const { ObjectId } = require("mongodb")
const { move, moveFolder } = require("../../modules/blueprint")

module.exports = {
    /**
     * Move-blueprint packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} blueprintId
     * @param {string} oldPath
     * @param {string} newPath
     * @param {() => {}} callback
    */
    blueprint: async (accountInfo, sessionId, blueprintId, oldPath, newPath, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-blueprint")
        try {
            await move(sessionId, blueprintId, oldPath, newPath)
            callback(true)
        } catch (error) {
            console.error("Failed to move blueprint", error)
            callback(false, error.message)
        }
    },

    /**
     * Move-blueprint-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} oldPath
     * @param {string} newPath
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, oldPath, newPath, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-blueprint-folder")
        try {
            await moveFolder(sessionId, oldPath, newPath)
            callback(true)
        } catch (error) {
            console.error("Failed to move folder", error)
            callback(false, error.message)
        }
    }
}