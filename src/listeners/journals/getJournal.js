const { ObjectId } = require("mongodb")
const { get, getAll } = require("../../modules/journals")

module.exports = {
    /**
     * Get-journal packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} journalId
     * @param {() => {}} callback
    */
    single: async (accountInfo, journalId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-journal")
        try {
            const journals = await get(journalId)
            callback(true, journals)
        } catch (error) {
            console.error("Failed to get journal", error)
            callback(false, error.message)
        }
    },

    /**
     * Get-all-journals packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {() => {}} callback
    */
    all: async (accountInfo, sessionId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-all-journals")
        try {
            const journals = await getAll(sessionId, accountInfo.uid)
            callback(true, journals)
        } catch (error) {
            console.error("Failed to get journals", error)
            callback(false, error.message)
        }
    }
}
