const { ObjectId } = require("mongodb")
const { get, getAll } = require("../../modules/blueprint")

module.exports = {
    /**
     * Get-blueprint packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} blueprintId
     * @param {() => {}} callback
    */
    single: async (accountInfo, blueprintId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-blueprint")
        try {
            const blueprints = await get(blueprintId)
            callback(true, blueprints)
        } catch (error) {
            console.error("Failed to get blueprint", error)
            callback(false, error.message)
        }
    },

    /**
     * Get-all-blueprints packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {() => {}} callback
    */
    all: async (accountInfo, sessionId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-all-blueprints")
        try {
            const blueprints = await getAll(sessionId)
            callback(true, blueprints)
        } catch (error) {
            console.error("Failed to get blueprints", error)
            callback(false, error.message)
        }
    }
}
