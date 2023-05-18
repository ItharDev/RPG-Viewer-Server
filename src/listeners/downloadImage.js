const { ObjectId } = require("mongodb")
const networking = require("../modules/networking")

/**
 * Download-image packet listener
 * @param {{ uid: import("mongoose").ObjectId, username: string }} accountInfo Account information
 * @param {string} imageId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, imageId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: download-image")
    try {
        const buffer = await networking.downloadFile(ObjectId(imageId))
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, `Asset load: ${imageId}, size: ${buffer.size}`)
        callback(true, buffer)
    } catch (error) {
        console.error("Failed to download and send an image", error)
        callback(false, error.message)
    }
}
