const { ObjectId } = require("mongodb")
const { get } = require("../../modules/lights")

/**
 * Get-light packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} lightId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, lightId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-light")
    try {
        const light = await get(lightId)
        callback(true, light)
    } catch (error) {
        console.error("Failed to get light data", error)
        callback(false, error.message)
    }
}