const { ObjectId } = require("mongodb")
const { get } = require("../../modules/notes")

/**
 * Get-note packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} noteId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, noteId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-note")
    try {
        const note = await get(noteId)
        callback(true, note)
    } catch (error) {
        console.error("Failed to get note data", error)
        callback(false, error.message)
    }
}