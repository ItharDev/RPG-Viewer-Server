const { ObjectId } = require("mongodb")
const { create, createFolder } = require("../../modules/blueprint")
const { blueprintModel } = require("../../schemas")

module.exports = {
    /**
     * Create-blueprint packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {{}} data
     * @param {() => {}} callback
    */
    blueprint: async (accountInfo, sessionId, path, data, buffer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-blueprint")
        try {
            data.info.image = new ObjectId()
            const model = new blueprintModel(data)

            const id = await create(sessionId, path, model, buffer)
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