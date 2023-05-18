const { ObjectId } = require("mongodb")
const { get } = require("../../modules/account")

/**
 * Get-user packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo
 * @param {string} uid
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, uid, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-user")
    try {
        const accountData = await get(ObjectId(uid))
        callback(true, accountData)
    } catch (error) {
        console.error("Failed to get user", error)
        callback(false, error.message)
    }
}
