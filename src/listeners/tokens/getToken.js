const { ObjectId } = require("mongodb")
const { get, getAll } = require("../../modules/token")

module.exports = {
    /**
     * Get-token packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} tokenId
     * @param {() => {}} callback
    */
    single: async (accountInfo, tokenId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-token")
        try {
            const token = await get(tokenId)
            callback(true, token)
        } catch (error) {
            console.error("Failed to get token", error)
            callback(false, error.message)
        }
    },

    /**
     * Get-all-tokens packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {() => {}} callback
    */
    all: async (accountInfo, sceneId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-all-tokens")
        try {
            const tokens = await getAll(sceneId)
            callback(true, tokens)
        } catch (error) {
            console.error("Failed to get tokens", error)
            callback(false, error.message)
        }
    }
}
