const { ObjectId } = require("mongodb")
const { get } = require("../../modules/effects")

/**
 * Get-effect packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} effectId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, effectId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-effect")
    try {
        const effect = await get(effectId)
        callback(true, effect)
    } catch (error) {
        console.error("Failed to get effect data", error)
        callback(false, error.message)
    }
}