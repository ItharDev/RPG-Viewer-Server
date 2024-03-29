const { ObjectId } = require("mongodb")
const { changeName } = require("../../modules/account")

/**
 * Change-name packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {string} name
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, name, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: change-name")
    try {
        await changeName(accountInfo.uid, name)
        accountInfo.username = name
        callback(true)
    } catch (error) {
        console.error("Failed to change name", error)
        callback(false, error.message)
    }
}
