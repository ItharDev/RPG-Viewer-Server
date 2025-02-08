const { ObjectId } = require("mongodb")
const { group } = require("../../modules/token")

/**
 * Group-tokens packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sceneId
 * @param {ObjectId[]} tokens
 * @param {number} groupNumber
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sceneId, tokens, groupNumber, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: group-tokens")
    try {
        await group(sceneId, tokens, groupNumber)
        callback(true)
    } catch (error) {
        console.error("Failed to lock token", error)
        callback(false, error.message)
    }
}