const { journalModel, sessionModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const networking = require("./networking")
const getFolder = require("./getFolder")
const { prepareConnection } = require("../database")

module.exports = {
    /**
     * Get-journal handler
     * @param {ObjectId} journalId
     * @returns {Promise<journalModel>}
    */
    get: async function (journalId) {
        await prepareConnection()

        const journal = await journalModel.findById(journalId).exec()
        if (!journal) throw new Error("Failed to load journal page")

        return journal
    },

    /**
     * Get-all-journals handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} userId
     * @returns {Promise<{}>}
    */
    getAll: async function (sessionId, userId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        return session.journals[userId.toString()]
    },

    /**
     * Create-journal handler
     * @param {ObjectId} sessionId
     * @param {string} accountId
     * @param {string} path
     * @param {journalModel} data
     * @returns {Promise<string>}
    */
    create: async function (sessionId, accountId, path, data) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const journal = await journalModel.create(data)
        if (!journal) throw new Error("Failed to create journal")

        const targetFolder = await getFolder(session.journals[accountId.toString()], path)
        if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${accountId}.folders.${targetFolder.path}.contents`]: journal._id } }).exec()
        else await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${accountId}.contents`]: journal._id } }).exec()

        return journal.id
    },

    /**
     * Remove-journal handler
     * @param {ObjectId} sessionId     
     * @param {string} accountId
     * @param {string} path 
     * @param {ObjectId} journalId 
     * @returns {Promise<void>}
     */
    remove: async function (sessionId, accountId, path, journalId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const targetFolder = await getFolder(session.journals[accountId.toString()], path)
        if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${accountId}.folders.${targetFolder.path}.contents`]: journalId } }).exec()
        else await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${accountId}.contents`]: journalId } }).exec()

        const journal = await journalModel.findByIdAndDelete(journalId).exec()
        if (!journal) throw new Error("Invalid journal id")

        for (let i = 0; i < journal.collaborators.length; i++) {
            const element = journal.collaborators[i];
            const user = element.user
            const isCollaborator = element.isCollaborator
            if (!isCollaborator) continue

            path = path.slice(24)
            path = path.replace(/^/, `${user}`);

            const sharedFolder = await getFolder(session.journals[accountId.toString()], path)
            if (!sharedFolder) throw new Error("Path not found")

            await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${user}.folders.${sharedFolder.path}.contents`]: journalId } }).exec()
        }

        if (journal.image) await networking.modifyFile(journal.image, -1)
    },

    /**
     * Modify-journal-text handler
     * @param {ObjectId} journalId
     * @param {string} text
     * @returns {Promise<void>}
    */
    modifyText: async function (journalId, text) {
        await prepareConnection()

        const update = await journalModel.findByIdAndUpdate(journalId, { $set: { "text": text } }).exec()
        if (!update) throw new Error("Failed to modify journal page")
    },

    /**
     * Modify-journal-header handler
     * @param {ObjectId} journalId
     * @param {string} text
     * @returns {Promise<void>}
    */
    modifyHeader: async function (journalId, text) {
        await prepareConnection()

        const update = await journalModel.findByIdAndUpdate(journalId, { $set: { "header": text } }).exec()
        if (!update) throw new Error("Failed to modify journal page")
    },

    /**
     * Modify-journal-image handler
     * @param {ObjectId} journalId
     * @param {Buffer} buffer
     * @returns {Promise<string>}
    */
    modifyImage: async function (journalId, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const id = buffer ? new ObjectId() : undefined
            const journal = await journalModel.findById(journalId).exec()
            if (journal.image) await networking.modifyFile(journal.image, -1).then(null, (rejected) => {
                reject(rejected)
                return
            })

            if (buffer) {
                await networking.uploadFile(id, buffer).then(async (resolved) => {
                    const update = await journalModel.findByIdAndUpdate(journalId, { $set: { image: id } }).exec()
                    if (!update) reject("Failed to modify journal page")

                    resolve(id)
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }
            else {
                const update = await journalModel.findByIdAndUpdate(journalId, { $set: { image: id } }).exec()
                if (!update) {
                    reject("Failed to modify journal page")
                    return
                }

                resolve(id)
            }
        })
    },

    /**
     * Set-collaborators handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {Array<{user: string, isCollaborator: boolean}>} collaborators
     * @returns {Promise<void>}
    */
    setCollaborators: async function (sessionId, journalId, collaborators) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const journal = await journalModel.findById(journalId).exec()
        if (!journal) throw new Error("Invalid journal id")

        for (let i = 0; i < collaborators.length; i++) {
            const element = collaborators[i]
            const user = element.user
            const isCollaborator = element.isCollaborator

            if (!session.journals[`${user}.folders.shared.folders.${journal.owner.toString()}`]) {
                const createdFolder = {
                    name: journal.owner.toString(),
                    folders: {},
                    contents: []
                }
                await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${user}.folders.shared.folders.${journal.owner.toString()}`]: createdFolder } }).exec()
            }
            if (isCollaborator) {
                await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${user}.folders.shared.folders.${journal.owner.toString()}.contents`]: journalId } }).exec()
            } else {
                await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${user}.folders.shared.folders.${journal.owner.toString()}.contents`]: journalId } }).exec()
            }
        }
        const update = await journalModel.findByIdAndUpdate(journalId, { $set: { collaborators: collaborators } }).exec()
        if (!update) throw new Error("Failed to update collaborators")
    },

    /**
     * Save-journal handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} journalId
     * @param {string} accountId
     * @returns {Promise<string>}
    */
    saveJournal: async function (sessionId, journalId, accountId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const originalJournal = await journalModel.findById(journalId).exec()
        if (!originalJournal) throw new Error("Invalid journal id")

        const journalData = {
            owner: ObjectId(accountId),
            header: originalJournal.header,
            text: originalJournal.text,
            image: originalJournal.image,
            collaborators: []
        }

        const newJournal = await journalModel.create(journalData)

        await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${accountId}.contents`]: newJournal._id } }).exec()

        return newJournal.id
    },

    /**
     * Move-journal handler
     * @param {ObjectId} sessionId 
     * @param {string} accountId
     * @param {ObjectId} journalId 
     * @param {string} oldPath 
     * @param {string} newPath 
     * @returns {Promise<void>}
     */
    move: async function (sessionId, accountId, journalId, oldPath, newPath) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const oldFolder = await getFolder(session.journals[accountId.toString()], oldPath)

        let pull
        let push

        if (!oldPath) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${accountId}.contents`]: journalId } }).exec()
        else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${accountId}.folders.${oldFolder.path}.contents`]: journalId } }).exec()
        if (!pull) throw new Error("Failed to pull journal page from old location")

        const newState = await sessionModel.findById(sessionId).exec()
        const newFolder = await getFolder(newState.journals[accountId], newPath)

        if (!newPath) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${accountId}.contents`]: journalId } }).exec()
        else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${accountId}.folders.${newFolder.path}.contents`]: journalId } }).exec()

        if (!push) throw new Error("Failed to push journal page to new location")
    },

    /**
     * Create-folder handler
     * @param {ObjectId} sessionId
     * @param {string} accountId
     * @param {string} path 
     * @param {string} name 
     * @returns {Promise<string>}
     */
    createFolder: async function (sessionId, accountId, path, name) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const id = new ObjectId().toString()
        const data = {
            name: name,
            folders: {},
            contents: []
        }

        const targetFolder = await getFolder(session.journals[accountId.toString()], path)
        if (targetFolder) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${targetFolder.path}.folders.${id}`]: data } }).exec()
            if (!update) throw new Error("Failed to create folder")
        } else {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${id}`]: data } }).exec()
            if (!update) throw new Error("Failed to create folder")
        }

        return id
    },

    /**
     * Remove-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} accountId 
     * @param {string} path 
     * @returns {Promise<void>}
     */
    removeFolder: async function (sessionId, accountId, path) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const oldFolder = await getFolder(session.journals[accountId.toString()], path)
        for (let i = 0; i < oldFolder.contents.length; i++) {
            await module.exports.remove(sessionId, accountId, path, oldFolder.contents[i])
        }

        let paths = path.split("/")
        const folderId = paths.pop()

        const targetFolder = await getFolder(session.journals[accountId.toString()], paths.join("/"))
        if (targetFolder) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`journals.${accountId}.folders.${targetFolder.path}.folders.${folderId}`]: "" } }).exec()
            if (!update) throw new Error("Failed to remove folder")
        } else {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`journals.${accountId}.folders.${folderId}`]: "" } }).exec()
            if (!update) throw new Error("Failed to remove folder")
        }
    },

    /**
     * Rename-folder handler
     * @param {ObjectId} sessionId
     * @param {string} accountId
     * @param {string} path
     * @param {string} name
     * @returns {Promise<void>}
     */
    renameFolder: async function (sessionId, accountId, path, name) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const targetFolder = await getFolder(session.journals[accountId.toString()], path)
        if (!targetFolder) throw new Error("Target folder not found")

        const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${targetFolder.path}.name`]: name } }).exec()
        if (!update) throw new Error("Failed to rename folder")
    },

    /**
     * Move-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} accountId 
     * @param {string} oldPath 
     * @param {string} newPath 
     * @returns {Promise<void>}
     */
    moveFolder: async function (sessionId, accountId, oldPath, newPath) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        let oldPaths = oldPath.split("/")
        const oldId = oldPaths.pop()

        let pull
        let push

        const oldFolder = await getFolder(session.journals[accountId.toString()], oldPaths.join("/"))
        if (oldFolder) pull = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`journals.${accountId}.folders.${oldFolder.path}.folders.${oldId}`]: "" } }).exec()
        else pull = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`journals.${accountId}.folders.${oldId}`]: "" } }).exec()
        if (!pull) throw new Error("Failed to pull the folder from old location")

        const newState = await sessionModel.findById(sessionId).exec()
        const newFolder = await getFolder(newState.journals[accountId], newPath)

        if (newFolder) {
            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${newFolder.path}.folders.${oldId}`]: oldFolder.folders[oldId] } }).exec()
            else push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${newFolder.path}.folders.${oldId}`]: session.journals.folders[oldId] } }).exec()
        } else {
            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${oldId}`]: oldFolder.folders[oldId] } }).exec()
            else push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${accountId}.folders.${oldId}`]: session.journals.folders[oldId] } }).exec()
        }
        if (!push) throw new Error("Failed to push the folder to new location")
    },
}