const { signIn } = require("../../modules/account")

/**
 * Sign-in packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {string} email
 * @param {string} password
 * @param {string} uid
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, email, password, uid, callback) => {
    console.debug("[ ??? (???) ]", "Package: sign-in (attempt)")
    try {
        const user = await signIn(email, password, uid)
        accountInfo.uid = user._id
        accountInfo.username = user.name
        console.log(`User ${accountInfo.username} (${accountInfo.uid}) signed in.`)
        callback(true, accountInfo.username, accountInfo.uid.toString())
    } catch (error) {
        console.error("Failed to login account", error)
        callback(false, error.message)
    }
}
