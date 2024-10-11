const { ObjectId } = require("mongodb")
const { create, createFolder } = require("../../modules/journals")
const { journalModel } = require("../../schemas")

module.exports = {
    /**
     * Create-journal packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {{}} journalData
     * @param {() => {}} callback
    */
    journal: async (accountInfo, sessionId, path, journalData, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-journal")
        try {
            journalData.image = null
            const model = new journalModel(journalData)

            const id = await create(sessionId, accountInfo.uid, path, model)
            callback(true, id)
        } catch (error) {
            console.error("Failed to create journal", error)
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
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-journal-folder")
        try {
            const id = await createFolder(sessionId, accountInfo.uid, path, name)
            callback(true, id)
        } catch (error) {
            console.error("Failed to create folder", error)
            callback(false, error.message)
        }
    }
}