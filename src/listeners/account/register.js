const { register } = require("../../modules/account")
const { userModel } = require("../../schemas")

/**
 * Register packet listener
 * @param {string} email
 * @param {string} name
 * @param {string} password
 * @param {() => {}} callback
*/
module.exports = async (email, name, password, callback) => {
    console.debug("[ ??? (???) ]", "Package: register")
    try {
        await register(new userModel({
            email,
            name,
            password,
            online: false,
            licences: []
        }))
        console.log(`Registered a new account ${name} (${email}).`)
        callback(true)
    } catch (error) {
        console.error("Failed to register account", error)
        callback(false, error.message)
    }
}
