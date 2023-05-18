const { ObjectId } = require("mongodb")
const { create } = require("../../modules/session")
const { sessionModel } = require("../../schemas")

/**
 * Create-session packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {string} name
 * @param {Buffer} buffer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, name, buffer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-session")
    try {
        await create(accountInfo.uid, new sessionModel({
            name,
            master: accountInfo.uid,
            users: [],
            state: {
                synced: false
            },
            blueprints: [],
            scenes: [],
            background: new ObjectId()
        }), buffer)
        console.log(`Session ${name} created by ${accountInfo.username} (${accountInfo.uid})`)
        callback(true)
    } catch (error) {
        console.error("Failed to create session", error)
        callback(error.message)
    }
}
