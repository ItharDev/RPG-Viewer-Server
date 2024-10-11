const { ObjectId } = require("mongodb")
const { move, modifyText, modifyImage, modifyHeader, setGlobal } = require("../../modules/notes")
const { Server } = require("socket.io")

module.exports = {
    /**
     * Move-note packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {ObjectId} noteId
     * @param {{}} data
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    move: async (accountInfo, sessionId, sceneId, noteId, data, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: move-note")
        try {
            await move(sceneId, noteId, data)
            socketServer.to(sessionId.toString()).emit("move-note", noteId, data)
            callback(true)
        } catch (error) {
            console.error("Failed to move note", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-note-text packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} noteId
     * @param {string} text
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    modifyText: async (accountInfo, sessionId, noteId, text, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-note-text")
        try {
            await modifyText(noteId, text)
            socketServer.to(sessionId.toString()).emit("modify-note-text", noteId, text, accountInfo.uid)
            callback(true)
        } catch (error) {
            console.error("Failed to modify note text", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-note-header packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} noteId
     * @param {string} header
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    modifyHeader: async (accountInfo, sessionId, noteId, header, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-note-header")
        try {
            await modifyHeader(noteId, header)
            socketServer.to(sessionId.toString()).emit("modify-note-header", noteId, header, accountInfo.uid)
            callback(true)
        } catch (error) {
            console.error("Failed to modify note header", error)
            callback(false, error.message)
        }
    },

    /**
     * Modify-note-image packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} noteId
     * @param {Buffer} buffer
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    modifyImage: async (accountInfo, sessionId, noteId, buffer, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: modify-note-image")
        try {
            const id = await modifyImage(noteId, buffer)
            socketServer.to(sessionId.toString()).emit("modify-note-image", noteId, id)
            callback(true)
        } catch (error) {
            console.error("Failed to modify note image", error)
            callback(false, error.message)
        }
    },

    /**
     * Set-note-global packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {ObjectId} noteId
     * @param {boolean} isGlobal
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    setGlobal: async (accountInfo, sessionId, sceneId, noteId, isGlobal, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: set-note-global")
        try {
            await setGlobal(sceneId, noteId, isGlobal)
            socketServer.to(sessionId.toString()).emit("set-note-global", noteId, isGlobal)
            callback(true)
        } catch (error) {
            console.error("Failed to set note global", error)
            callback(false, error.message)
        }
    },
}