/**
 * Sign-out packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: sign-out")
    try {
        console.log(`User ${accountInfo.username} (${accountInfo.uid}) signed out.`)
        accountInfo.username = null
        accountInfo.uid = null
        callback(true)
    } catch (error) {
        console.error("Failed to sign-out account", error)
        callback(false, error.message)
    }
}
