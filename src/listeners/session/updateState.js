const { ObjectId } = require("mongodb")

/**
 * Set-state packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {{ id: ObjectId | null, master: ObjectId | null, isMaster: boolean | null, synced: boolean | null, scene: ObjectId | null, users: Array | null, background: ObjectId | null }} sessionInfo
 * @param {ObjectId | null} scene
 * @param {boolean} synced
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionInfo, scene, synced, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: update-state")
    try {
        sessionInfo.scene = scene
        sessionInfo.synced = synced

        callback(true)
    } catch (error) {
        console.error("Failed to update state", error)
        callback(false, error.message)
    }
}
