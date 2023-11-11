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
        const model = new userModel({
            email,
            name,
            password,
            licences: []
        })
        
        await register(model)
        callback(true)
    } catch (error) {
        console.error("Failed to register account", error)
        callback(false, error.message)
    }
}
