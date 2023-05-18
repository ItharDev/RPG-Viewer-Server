const { validateLicence } = require("../../modules/account")

/**
 * Validate-license packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {string} license
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, license, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: validate-licence")
    try {
        await validateLicence(license, accountInfo.uid)
        callback(true)
    } catch (error) {
        console.debug("Failed to validate licence", error)
        callback(false, error.message)
    }
}
