const { ObjectId } = require("mongodb")
const { saveNote } = require("../../modules/notes")

/**
 * Save-note packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} noteId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, noteId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: save-note")
    try {
        saveNote(sessionId, noteId, accountInfo.uid)
        callback(true)
    } catch (error) {
        console.error("Failed to save note", error)
        callback(false, error.message)
    }
}