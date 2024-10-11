const { ObjectId } = require("mongodb")
const { move, moveFolder } = require("../../modules/journals")

module.exports = {
    /**
     * Move-journal packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {string} oldPath
     * @param {string} newPath
     * @param {() => {}} callback
    */
    journal: async (accountInfo, sessionId, journalId, oldPath, newPath, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-journal")
        try {
            await move(sessionId, accountInfo.uid, journalId, oldPath, newPath)
            callback(true)
        } catch (error) {
            console.error("Failed to move journal", error)
            callback(false, error.message)
        }
    },

    /**
     * Move-journal-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} oldPath
     * @param {string} newPath
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, oldPath, newPath, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-journal-folder")
        try {
            await moveFolder(sessionId, accountInfo.uid, oldPath, newPath)
            callback(true)
        } catch (error) {
            console.error("Failed to move folder", error)
            callback(false, error.message)
        }
    }
}