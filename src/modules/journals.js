const { journalModel, sessionModel } = require('../schemas')
const folder = require('./folder')
const account = require('./account')
const { ObjectId } = require('mongodb')
const { connect } = require('mongoose')
const networking = require('./networking')

async function prepareConnection() {
    return new Promise((resolve, reject) => {
        if (global.databaseConnected !== true) {
            connect('mongodb://127.0.0.1:27017/rpg-viewer').then((db) => {
                global.databaseConnected = true
                db.connection.once("error", (err) => {
                    console.error("Mongoose error:", err)
                    setTimeout(async () => {
                        console.warn("Trying to reconnect...")
                        await prepareConnection()
                        resolve()
                    }, 5000)
                })
                resolve()
            }).catch((...err) => reject(...err))
        } else {
            resolve()
        }
    })
}

module.exports = {
    get: async function (journalId) {
        await prepareConnection()

        const journal = await journalModel.findById(journalId).exec()
        if (journal) return journal
        else throw new Error('Failed to load journal page')
    },

    getAll: async function (sessionId, userId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (session) {
            const documents = session.journals.find(x => x.owner.toString() === userId.toString())
            if (documents) return documents.contents
            else throw new Error('Invalid user id')
        }
        else throw new Error('Invalid session id')
    },

    create: async function (sessionId, path, data) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const journal = await journalModel.create(data)
            if (journal) {
                const documents = document.journals.find(x => x.owner.toString() === data.owner.toString())
                if (documents) {
                    const targetFolder = await folder.get(documents.contents, path)
                    if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${document.journals.indexOf(documents)}.contents.${targetFolder.path}.contents`]: journal._id } }).exec()
                    else await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${document.journals.indexOf(documents)}.contents`]: journal._id } }).exec()

                    return (journal)
                }
                else throw new Error('Invalid user id')
            }
            else throw new Error('Failed to create journal page')
        } else throw new Error('Failed to create journal page')
    },

    remove: async function (sessionId, path, userId, journalId) {
        await prepareConnection()
        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const documents = document.journals.find(x => x.owner.toString() === userId.toString())
            if (documents) {
                const targetFolder = await folder.get(documents.contents, path)
                if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(documents)}.contents.${targetFolder.path}.contents`]: journalId } }).exec()
                else await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(documents)}.contents`]: journalId } }).exec()
            }

            const journal = await journalModel.findByIdAndDelete(journalId)
            if (journal) {
                for (let i = 0; i < journal.collaborators.length; i++) {
                    const element = journal.collaborators[i];
                    const user = element.user
                    const documents = document.journals.find(x => x.owner.toString() === user.toString())
                    if (!documents) continue
                    await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(documents)}.contents.0.contents`]: journalId } }).exec()
                }
                if (journal.image) await networking.modifyFile(journal.image, -1)
            }
            else throw new Error('Failed to remove journal page')
        } else throw new Error('Failed to remove journal page')
    },

    modifyText: async function (journalId, text) {
        await prepareConnection()

        const update = await journalModel.findByIdAndUpdate(journalId, { $set: { 'text': text } }).exec()
        if (!update) throw new Error('Failed to modify journal page')
    },

    modifyHeader: async function (journalId, text) {
        await prepareConnection()

        const update = await journalModel.findByIdAndUpdate(journalId, { $set: { 'header': text } }).exec()
        if (!update) throw new Error('Failed to modify journal page')
    },

    modifyImage: async function (journalId, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const id = buffer ? new ObjectId() : undefined
            const journal = await journalModel.findById(journalId).exec()
            if (journal.image) await networking.modifyFile(journal.image, -1).then(null, (rejected) => {
                reject(rejected)
            })

            if (buffer) {
                await networking.uploadFile(id, buffer).then(async (resolved) => {
                    const update = await journalModel.findByIdAndUpdate(journalId, { $set: { image: id } }).exec()
                    if (!update) reject('Failed to modify journal page')
                    resolve(id)
                }, (rejected) => {
                    reject(rejected)
                })
            }
            else {
                const update = await journalModel.findByIdAndUpdate(journalId, { $set: { image: id } }).exec()
                if (!update) reject('Failed to modify journal page')
                resolve(id)
            }
        })
    },

    refreshCollaborators: async function (sessionId, journalId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        const journal = await journalModel.findById(journalId).exec()
        for (let i = 0; i < session.users.length; i++) {
            if (session.users[i].toString() === journal.owner.toString()) continue

            const user = await account.get(session.users[i]);
            if (!journal.collaborators.find(obj => obj.user.equals(user._id))) {
                const collaborator = {
                    user: user._id,
                    isCollaborator: false
                }
                const update = await journalModel.findByIdAndUpdate(journalId, { $addToSet: { collaborators: collaborator } }).exec()
            }
        }

        if (session.master.toString() != journal.owner.toString()) {
            const collaborator = {
                user: session.master,
                isCollaborator: false
            }
            const update = await journalModel.findByIdAndUpdate(journalId, { $addToSet: { collaborators: collaborator } }).exec()
        }

        const newState = await journalModel.findById(journalId).exec()
        return newState
    },

    setCollaborators: async function (journalId, collaborators, sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (session) {
            for (let i = 0; i < collaborators.length; i++) {
                const element = collaborators[i]
                const user = element.user
                const documents = session.journals.find(x => x.owner.toString() === user.toString())
                if (!documents) continue
                if (element.isCollaborator) {
                    await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${session.journals.indexOf(documents)}.contents.0.contents`]: journalId } }).exec()
                } else {
                    await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${session.journals.indexOf(documents)}.contents.0.contents`]: journalId } }).exec()
                }
            }
            const update = await journalModel.findByIdAndUpdate(journalId, { $set: { collaborators: collaborators } }).exec()
            if (!update) throw new Error('Failed to update collaborators')
        }
        else throw new Error('Invalid session id')
    },

    move: async function (sessionId, journalId, oldPath, newPath) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const journal = await journalModel.findById(journalId).exec()
            const oldDocuments = document.journals.find(x => x.owner.toString() === journal.owner.toString())
            if (oldDocuments) {
                const oldFolder = await folder.get(oldDocuments.contents, oldPath)

                let pull
                let push

                if (!oldPath) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(oldDocuments)}.contents`]: journalId } }).exec()
                else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(oldDocuments)}.contents.${oldFolder.path}.contents`]: journalId } }).exec()

                if (pull) {
                    const newState = await sessionModel.findById(sessionId).exec()
                    const newDocuments = newState.journals.find(x => x.owner.toString() === journal.owner.toString())
                    const newFolder = await folder.get(newDocuments.contents, newPath)

                    if (!newPath) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${newState.journals.indexOf(newDocuments)}.contents`]: journalId } }).exec()
                    else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${newState.journals.indexOf(newDocuments)}.contents.${newFolder.path}.contents`]: journalId } }).exec()

                    if (!push) throw new Error('Failed to move journal page')
                }
                else throw new Error('Failed to move journal page')
            } else throw new Error('Invalid user id')
        } else throw new Error('Failed to move journal page')
    },

    createFolder: async function (sessionId, path, userId, name) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const struct = {
                id: new ObjectId(),
                name: name,
                subFolders: [],
                contents: []
            }

            const documents = document.journals.find(x => x.owner.toString() === userId.toString())
            if (documents) {
                const targetFolder = await folder.get(documents.contents, path)
                if (targetFolder) {
                    const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${document.journals.indexOf(documents)}.contents.${targetFolder.path}.subFolders`]: struct } }).exec()
                    if (update) return struct.id
                    else throw new Error('Failed to create folder')
                } else {
                    const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${document.journals.indexOf(documents)}.contents`]: struct } }).exec()
                    if (update) return struct.id
                    else throw new Error('Failed to create folder')
                }
            } else throw new Error('Invalid user id')
        } else throw new Error('Failed to create folder')
    },

    removeFolder: async function (sessionId, path, userId) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const documents = document.journals.find(x => x.owner.toString() === userId.toString())
            if (documents) {
                const oldFolder = await folder.get(documents.contents, path)
                for (let i = 0; i < oldFolder.contents.length; i++) {
                    const element = oldFolder.contents[i];
                    await this.remove(sessionId, path, userId, element)
                }

                let paths = path.split('/')
                const folderId = paths.pop()

                const targetFolder = await folder.get(documents.contents, paths.join('/'))
                if (targetFolder) {
                    const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(documents)}.contents.${targetFolder.path}.subFolders`]: { id: ObjectId(folderId) } } }).exec()
                    if (!update) throw new Error('Failed to remove folder')
                } else {
                    const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(documents)}.contents`]: { id: ObjectId(folderId) } } }).exec()
                    if (!update) throw new Error('Failed to remove folder')
                }
            } else throw new Error('Invalid user id')
        } else throw new Error('Failed to remove folder')
    },

    renameFolder: async function (sessionId, path, userId, name) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const documents = document.journals.find(x => x.owner.toString() === userId.toString())
            if (documents) {
                const targetFolder = await folder.get(documents.contents, path)
                if (targetFolder) {
                    const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`journals.${document.journals.indexOf(documents)}.contents.${targetFolder.path}.name`]: name } }).exec()
                    if (!update) throw new Error('Failed to rename folder')
                } else throw new Error('Failed to rename folder')
            } else throw new Error('Invalid user id')
        } else throw new Error('Failed to rename folder')
    },

    moveFolder: async function (sessionId, oldPath, newPath, userId) {
        await prepareConnection()

        const document = await sessionModel.findById(sessionId).exec()
        if (document) {
            const oldDocuments = document.journals.find(x => x.owner.toString() === data.owner.toString())
            if (oldDocuments) {
                let oldPaths = oldPath.split('/')
                const oldId = oldPaths.pop()

                let pull
                let push

                const oldFolder = await folder.get(oldDocuments.contents, oldPaths.join('/'))
                if (oldFolder) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(oldDocuments)}.contents.${oldFolder.path}.subFolders`]: { id: ObjectId(oldId) } } }).exec()
                else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`journals.${document.journals.indexOf(oldDocuments)}.contents`]: { id: ObjectId(oldId) } } }).exec()

                if (pull) {
                    const newState = await sessionModel.findById(sessionId).exec()
                    const newDocuments = newState.journals.find(x => x.owner.toString() === data.owner.toString())
                    if (newDocuments) {
                        const newFolder = await folder.get(newDocuments.contents, newPath)
                        if (newFolder) {
                            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${newState.journals.indexOf(newDocuments)}.contents.${newFolder.path}.subFolders`]: oldFolder.subFolders.find(obj => obj.id == oldId) } }).exec()
                            else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${newState.journals.indexOf(newDocuments)}.contents.${newFolder.path}.subFolders`]: oldDocuments.contentes.find(obj => obj.id == oldId) } }).exec()
                        } else {
                            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${newState.journals.indexOf(newDocuments)}.contents`]: oldFolder.subFolders.find(obj => obj.id == oldId) } }).exec()
                            else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`journals.${newState.journals.indexOf(newDocuments)}.contents`]: oldDocuments.contents.find(obj => obj.id == oldId) } }).exec()
                        }
                        if (!push) throw new Error('Failed to move folder')
                    }
                }
                else throw new Error('Failed to move folder')
            } else throw new Error('Invalid user id')
        } else throw new Error('Failed to move folder')
    }
}