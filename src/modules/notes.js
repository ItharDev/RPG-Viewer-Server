const { sceneModel, noteModel, sessionModel, journalModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const networking = require("./networking")
const { prepareConnection } = require("../database")


module.exports = {
    /**
     * Get-note handler
     * @param {ObjectId} noteId
     * @returns {Promise<noteModel>}
    */
    get: async function (noteId) {
        const note = await noteModel.findById(noteId).exec()
        if (!note) throw new Error("Invalid note id")

        return note
    },

    /**
     * Create-note handler
     * @param {ObjectId} sceneId
     * @param {noteModel} data
     * @param {{}} info
     * @returns {Promise<string>}
    */
    create: async function (sceneId, data, info) {
        await prepareConnection()

        const note = await noteModel.create(data)
        if (!note) throw new Error("Failed to create note")

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { [`notes.${note.id}`]: info } }).exec()
        if (!update) throw new Error("Failed to update directory")

        return note.id
    },

    /**
     * Remove-note handler
     * @param {ObjectId} sceneId
     * @param {ObjectId} noteId
     * @returns {Promise<void>}
    */
    remove: async function (sceneId, noteId) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const update = sceneModel.findByIdAndUpdate(sceneId, { $unset: { [`notes.${noteId.toString()}`]: "" } }).exec()
            if (!update) {
                reject("Failed to update directory")
                return
            }

            const note = await noteModel.findByIdAndDelete(noteId).exec()
            if (!note) {
                reject("Failed to remove note")
                return
            }

            if (note.image) await networking.modifyFile(note.image, -1).then(null, (rejected) => {
                reject(rejected)
                return
            })

            resolve()
        })
    },

    /**
     * Move-note handler
     * @param {ObjectId} sceneId
     * @param {ObjectId} noteId
     * @param {{}} data
     * @returns {Promise<void>}
    */
    move: async function (sceneId, noteId, data) {
        await prepareConnection()

        const update = sceneModel.findByIdAndUpdate(sceneId, { $set: { [`notes.${noteId}`]: data } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Modify-note-text handler
     * @param {ObjectId} noteId
     * @param {string} text
     * @returns {Promise<void>}
    */
    modifyText: async function (noteId, text) {
        await prepareConnection()

        const update = await noteModel.findByIdAndUpdate(noteId, { $set: { "text": text } }).exec()
        if (!update) throw new Error("Failed to modify note")
    },

    /**
     * Modify-note-header handler
     * @param {ObjectId} noteId
     * @param {string} text
     * @returns {Promise<void>}
    */
    modifyHeader: async function (noteId, text) {
        await prepareConnection()

        const update = await noteModel.findByIdAndUpdate(noteId, { $set: { "header": text } }).exec()
        if (!update) throw new Error("Failed to modify note")
    },

    /**
     * Modify-note-image handler
     * @param {ObjectId} noteId
     * @param {Buffer} buffer
     * @returns {Promise<string>}
    */
    modifyImage: async function (noteId, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const id = buffer ? new ObjectId() : undefined
            const note = await noteModel.findById(noteId).exec()
            if (note.image) await networking.modifyFile(note.image, -1).then(null, (rejected) => {
                reject(rejected)
                return
            })

            if (buffer) {
                await networking.uploadFile(id, buffer).then(async (resolved) => {
                    const update = await noteModel.findByIdAndUpdate(noteId, { $set: { image: id } }).exec()
                    if (!update) reject("Failed to modify note")
                    else resolve(id)
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }
            else {
                const update = await noteModel.findByIdAndUpdate(noteId, { $set: { image: id } }).exec()
                if (!update) reject("Failed to modify note")
                else resolve(id)
            }
        })
    },

    /**
     * Set-note-global handler
     * @param {ObjectId} sceneId
     * @param {ObjectId} noteId
     * @param {boolean} isGlobal
     * @returns {Promise<void>}
    */
    setGlobal: async function (sceneId, noteId, isGlobal) {
        await prepareConnection()

        const update = sceneModel.findByIdAndUpdate(sceneId, { $set: { [`notes.${noteId}.global`]: isGlobal } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Save-note handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} noteId
     * @param {string} accountId
     * @returns {Promise<string>}
    */
    saveNote: async function (sessionId, noteId, accountId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const originalNote = await noteModel.findById(noteId).exec()
        if (!originalNote) throw new Error("Invalid note id")

        const journalData = {
            owner: ObjectId(accountId),
            header: originalNote.header,
            text: originalNote.text,
            image: originalNote.image,
            collaborators: []
        }
        const newJournal = await journalModel.create(journalData)

        await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${accountId}.contents`]: newJournal._id } }).exec()

        return newJournal.id
    },
}