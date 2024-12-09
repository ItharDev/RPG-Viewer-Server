const { ObjectId } = require("mongodb")
const networking = require("../modules/networking")

/**
 * Download-image packet listener
 * @param {{ uid: ObjectId, username: string }} accountInfo
 * @param {string} imageId
 * @param {() => {}} callback
*/
module.exports = async (accountInfo, imageId, callback) => {
    console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: download-image")
    try {
        const buffer = await networking.downloadFile(ObjectId(imageId))
        callback(true, buffer)
    } catch (error) {
        console.error("Failed to download and send an image", error)
        callback(false, error)
    }
}
