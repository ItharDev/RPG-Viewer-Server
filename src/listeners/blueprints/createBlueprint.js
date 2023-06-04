const { ObjectId } = require("mongodb")
const { create, createFolder } = require("../../modules/blueprint")
const { blueprintModel, lightModel } = require("../../schemas")

module.exports = {
    /**
     * Create-blueprint packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {{}} tokenData
     * @param {{}} lightingData
     * @param {() => {}} callback
    */
    blueprint: async (accountInfo, sessionId, path, tokenData, lightingData, buffer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-blueprint")
        try {
            tokenData.image = new ObjectId()
            const model = new blueprintModel(tokenData)
            const lighting = new lightModel(lightingData)
            model.light = model._id
            lighting._id = model._id

            const id = await create(sessionId, path, model, lighting, buffer)
            callback(true)
        } catch (error) {
            console.error("Failed to create blueprint", error)
            callback(false, error.message)
        }
    },

    /**
     * Create-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {string} name
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, name, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-blueprint-folder")
        try {
            const id = await createFolder(sessionId, path, name)
            callback(true, id)
        } catch (error) {
            console.error("Failed to create folder", error)
            callback(false, error.message)
        }
    }
}