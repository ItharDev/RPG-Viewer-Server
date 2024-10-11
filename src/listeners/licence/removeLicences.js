const { ObjectId } = require("mongodb")
const { removeLicences } = require("../../modules/account")

/**
 * Remove-licences packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: remove-licences")
    try {
        await removeLicences(accountInfo.uid)
        callback(true)
    } catch (error) {
        console.debug("Failed to remove licences", error)
        callback(false, error.message)
    }
}
