const { ObjectId } = require("mongodb")
const { signIn } = require("../../modules/account")

/**
 * Sign-in packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {string} email
 * @param {string} password
 * @param {ObjectId} uid
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, email, password, uid, callback) => {
    console.debug("[ ??? (???) ]", "Package: sign-in")
    try {
        const user = await signIn(email, password, uid)
        accountInfo.uid = user._id
        accountInfo.username = user.name
        callback(true, accountInfo.username, accountInfo.uid.toString())
    } catch (error) {
        console.error("Failed to login account", error)
        callback(false, error.message)
    }
}
