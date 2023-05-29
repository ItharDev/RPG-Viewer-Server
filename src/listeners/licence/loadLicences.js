const { ObjectId } = require("mongodb")
const { loadLicences } = require("../../modules/account")

/**
 * Load-licences packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: load-licences")
    try {
        const licences = await loadLicences(accountInfo.uid)
        callback(true, licences)
    } catch (error) {
        console.debug("Failed to load licences", error)
        callback(false, error.message)
    }
}
