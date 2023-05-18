const { ObjectId } = require("mongodb")

/**
 * Sign-out packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: sign-out")
    try {
        accountInfo.username = null
        accountInfo.uid = null
        callback(true)
    } catch (error) {
        console.error("Failed to sign-out account", error)
        callback(false, error.message)
    }
}
