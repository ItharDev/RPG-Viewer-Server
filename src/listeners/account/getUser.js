const { ObjectId } = require("mongodb")
const { get } = require("../../modules/account")

/**
 * Get-user packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} uid
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, uid, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-user")
    try {
        const accountData = await get(uid, false)
        callback(true, accountData.name)
    } catch (error) {
        console.error("Failed to get user", error)
        callback(false, error.message)
    }
}

/**
 * Get-user packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} uid
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, uid, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-profile")
    try {
        const accountData = await get(uid, true)
        callback(true, accountData.name, accountData.email)
    } catch (error) {
        console.error("Failed to get user", error)
        callback(false, error.message)
    }
}
