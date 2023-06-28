const { ObjectId } = require("mongodb")
const { modify } = require("../../modules/blueprint")

/**
 * Modify-blueprint packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {ObjectId} sessionId
 * @param {ObjectId} id
 * @param {{}} tokenData
 * @param {{}} lightingData
 * @param {Buffer} buffer
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, sessionId, id, tokenData, lightingData, buffer, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-blueprint")
    try {
        const image = await modify(sessionId, id, tokenData, lightingData, buffer)
        callback(true, image)
    } catch (error) {
        console.error("Failed to modify blueprint", error)
        callback(false, error.message)
    }
}