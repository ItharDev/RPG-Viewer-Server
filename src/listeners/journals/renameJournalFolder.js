const { ObjectId } = require("mongodb")
const { renameFolder } = require("../../modules/journals")

/**
 * Rename-journal-folder packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {string} path
 * @param {string} name
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, path, name, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: rename-journal-folder")
    try {
        await renameFolder(sessionId, accountInfo.uid, path, name)
        callback(true)
    } catch (error) {
        console.error("Failed to rename folder", error)
        callback(false, error.message)
    }
}