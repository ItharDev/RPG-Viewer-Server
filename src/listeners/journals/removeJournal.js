const { ObjectId } = require("mongodb")
const { remove, removeFolder } = require("../../modules/journals")

module.exports = {
    /**
     * Remove-journal packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {ObjectId} journalId
     * @param {() => {}} callback
    */
    journal: async (accountInfo, sessionId, path, journalId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-journal")
        try {
            await remove(sessionId, accountInfo.uid, path, journalId)
            callback(true)
        } catch (error) {
            console.error("Failed to remove journal", error)
            callback(false, error.message)
        }
    },

    /**
     * Remove-journal-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-journal-folder")
        try {
            await removeFolder(sessionId, accountInfo.uid, path)
            callback(true)
        } catch (error) {
            console.error("Failed to remove folder", error)
            callback(false, error.message)
        }
    }
}