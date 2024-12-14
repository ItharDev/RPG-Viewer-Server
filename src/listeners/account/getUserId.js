const { ObjectId } = require("mongodb")
const { getId } = require("../../modules/account")

/**
 * Get-user packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {string} email
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, email, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-user-id")
    try {
        const uid = await getId(email)
        callback(true, uid)
    } catch (error) {
        console.error("Failed to get user id", error)
        callback(false, error.message)
    }
}
