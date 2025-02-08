const { ObjectId } = require("mongodb")
const { clearGroup } = require("../../modules/token")

/**
 * Clear-group packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sceneId
 * @param {number} groupNumber
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sceneId, groupNumber, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: clear-group")
    try {
        await clearGroup(sceneId, groupNumber)
        callback(true)
    } catch (error) {
        console.error("Failed to clear group", error)
        callback(false, error.message)
    }
}