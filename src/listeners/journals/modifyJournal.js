const { ObjectId } = require("mongodb")
const { modifyText, modifyHeader, modifyImage, setCollaborators } = require("../../modules/journals")

module.exports = {
    /**
     * Modify-journal-text packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {string} text
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    modifyText: async (accountInfo, sessionId, journalId, text, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-journal-text")
        try {
            await modifyText(journalId, text)
            socketServer.to(sessionId.toString()).emit("modify-journal-text", journalId, text, accountInfo.uid)
            callback(true)
        } catch (error) {
            console.error("Failed to modify journal text", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-journal-header packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {string} header
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    modifyHeader: async (accountInfo, sessionId, journalId, header, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-journal-header")
        try {
            await modifyHeader(journalId, header)
            socketServer.to(sessionId.toString()).emit("modify-journal-header", journalId, header, accountInfo.uid)
            callback(true)
        } catch (error) {
            console.error("Failed to modify journal header", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-journal-image packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {Buffer} buffer
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    modifyImage: async (accountInfo, sessionId, journalId, buffer, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-journal-image")
        try {
            const id = await modifyImage(journalId, buffer)
            socketServer.to(sessionId.toString()).emit("modify-journal-image", journalId, id)
            callback(true)
        } catch (error) {
            console.error("Failed to modify journal image", error)
            callback(false, error.message)
        }
    },

    /**
     * Share-journal packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {{}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    share: async (accountInfo, sessionId, journalId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: share-journal")
        try {
            await setCollaborators(sessionId, journalId, data.collaborators)
            socketServer.to(sessionId.toString()).emit("share-journal", journalId, accountInfo.uid, data)
            callback(true)
        } catch (error) {
            console.error("Failed to share journal page", error)
            callback(false, error.message)
        }
    },
}