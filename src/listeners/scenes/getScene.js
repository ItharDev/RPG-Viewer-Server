const { ObjectId } = require("mongodb")
const { get, getAll } = require("../../modules/scene")

module.exports = {
    /**
     * Get-scene packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sceneId
     * @param {() => {}} callback
    */
    single: async (accountInfo, sceneId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-scene")
        try {
            const scene = await get(sceneId)
            callback(true, scene)
        } catch (error) {
            console.error("Failed to get scene", error)
            callback(false, error.message)
        }
    },

    /**
     * Get-all-scenes packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {() => {}} callback
    */
    all: async (accountInfo, sessionId, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-all-scenes")
        try {
            const scenes = await getAll(sessionId)
            callback(true, scenes)
        } catch (error) {
            console.error("Failed to get scenes", error)
            callback(false, error.message)
        }
    }
}
