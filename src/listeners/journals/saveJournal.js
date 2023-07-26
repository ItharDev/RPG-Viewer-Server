const { ObjectId } = require("mongodb")
const { saveJournal } = require("../../modules/journals")

/**
 * Save-journal packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} journalId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, journalId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: save-journal")
    try {
        const id = await saveJournal(sessionId, journalId, accountInfo.uid)
        callback(true, id)
    } catch (error) {
        console.error("Failed to save journal", error)
        callback(false, error.message)
    }
}