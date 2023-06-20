const { ObjectId } = require("mongodb")
const { getUsers } = require("../../modules/session")

/**
 * Get-users packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-users")
    try {
        const accountData = await getUsers(sessionId)
        callback(true, accountData)
    } catch (error) {
        console.error("Failed to get users", error)
        callback(false, error.message)
    }
}
