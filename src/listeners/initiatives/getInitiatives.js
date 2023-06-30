const { ObjectId } = require("mongodb")
const { get } = require("../../modules/initiatives.js")

/**
 * Get-initiatives packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} scene
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, scene, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: get-initiatives")
    try {
        const data = await get(scene)
        callback(true, data)
    } catch (error) {
        console.error("Failed to get initiatives", error)
        callback(false, error.message)
    }
}
