const { ObjectId } = require("mongodb")
const { getSession } = require("../../modules/session")

/**
 * Get-users packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-session")
    try {
        const sessionData = await getSession(sessionId)
        callback(true, sessionData)
    } catch (error) {
        console.error("Failed to get session", error)
        callback(false, error.message)
    }
}