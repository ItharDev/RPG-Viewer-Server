const { ObjectId } = require("mongodb")
const { toggleGroup } = require("../../modules/token")

/**
 * Toggle-group packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sceneId
 * @param {number} groupNumber
 * @param {boolean} state
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sceneId, groupNumber, state, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: toggle-group")
    try {
        await toggleGroup(sceneId, groupNumber, state)
        callback(true)
    } catch (error) {
        console.error("Failed to toggle group", error)
        callback(false, error.message)
    }
}