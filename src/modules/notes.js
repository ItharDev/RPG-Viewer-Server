const { sceneModel, noteModel } = require('../schemas')
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
    get: async function (noteId) {
        const note = await noteModel.findById(noteId).exec()
        if (note) return note
        else throw new Error('Invalid note id')
    },

    getAll: async function (sceneId) {
        const scene = await sceneModel.findById(sceneId).exec()
        if (scene) {
            let notes = []
            for (let i = 0; i < scene.notes.length; i++) {
                const element = scene.notes[i];
                const note = await noteModel.findById(element).exec()
                notes.push(note)
            }

            return notes
        } else throw new Error('Invalid scene id')
    },

    create: async function (sceneId, data) {
        await prepareConnection()

        const note = await noteModel.create(data)
        if (note) {
            const update = await sceneModel.findByIdAndUpdate(sceneId, { $addToSet: { notes: note._id } }).exec()
            if (update) return note._id
            else throw new Error('Failed to update directory')
        } else throw new Error('Failed to create note')
    },

    remove: async function (sceneId, noteId) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const note = await noteModel.findByIdAndDelete(noteId).exec()
            if (note) {
                const update = await sceneModel.findByIdAndUpdate(sceneId, { $pull: { notes: note._id } }).exec()
                if (update) {
                    if (note.image) await networking.modifyFile(note.image, -1).then((resolved) => {
                        resolve()
                    }, (rejected) => {
                        reject(rejected)
                    })
                    else resolve()
                }
                else reject('Failed to update directory')
            } else reject('Failed to remove note')
        })
    },

    move: async function (noteId, position) {
        await prepareConnection()

        const update = await noteModel.findByIdAndUpdate(noteId, { $set: { 'position': position } }).exec()
        if (!update) throw new Error('Failed to update note position')
    },

    modifyText: async function (noteId, text) {
        await prepareConnection()

        const update = await noteModel.findByIdAndUpdate(noteId, { $set: { 'text': text } }).exec()
        if (!update) throw new Error('Failed to modify note')
    },

    modifyHeader: async function (noteId, text) {
        await prepareConnection()

        const update = await noteModel.findByIdAndUpdate(noteId, { $set: { 'header': text } }).exec()
        if (!update) throw new Error('Failed to modify note')
    },

    modifyImage: async function (noteId, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const id = buffer ? new ObjectId() : undefined
            const note = await noteModel.findById(noteId).exec()
            if (note.image) await networking.modifyFile(note.image, -1).then(null, (rejected) => {
                reject(rejected)
            })

            if (buffer) {
                await networking.uploadFile(id, buffer).then(async (resolved) => {
                    const update = await noteModel.findByIdAndUpdate(noteId, { $set: { image: id } }).exec()
                    if (!update) reject('Failed to modify note')
                    resolve(id)
                }, (rejected) => {
                    reject(rejected)
                })
            }
            else {
                const update = await noteModel.findByIdAndUpdate(noteId, { $set: { image: id } }).exec()
                if (!update) reject('Failed to modify note')
                resolve(id)
            }
        })
    },

    setPublic: async function (noteId, isPublic) {
        await prepareConnection()

        const update = await noteModel.findByIdAndUpdate(noteId, { $set: { 'isPublic': isPublic } }).exec()
        if (!update) throw new Error('Failed to update visibility')
    },
}