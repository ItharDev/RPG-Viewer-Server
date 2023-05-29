const { ObjectId } = require("mongodb")
const { create } = require("../../modules/session")
const { sessionModel } = require("../../schemas")

/**
 * Create-session packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {string} name
 * @param {Buffer} buffer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, name, buffer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-session")
    try {
        const model = new sessionModel({
            name,
            master: accountInfo.uid,
            users: [],
            state: {
                scene: undefined,
                synced: false
            },
            blueprints: [],
            scenes: [],
            background: new ObjectId()
        })

        await create(accountInfo.uid, model, buffer)
        callback(true)
    } catch (error) {
        console.error("Failed to create session", error)
        callback(false, error.message)
    }
}
