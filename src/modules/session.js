const { sessionModel, sceneModel, noteModel } = require('../schemas')
const socket = require('socket.io')
const { connect } = require('mongoose')
const { ObjectId } = require('mongodb')
const account = require('./account')
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
    create: async function (master, data, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            await networking.uploadFile(data.background, buffer).then(null, (rejected) => {
                reject(rejected)
            })

            const insert = await sessionModel.create(data)
            if (insert) {
                const licence = await account.validateLicence(insert._id, master)
                if (licence) resolve()
                else reject('Failed to validate licence')
            } else reject('Failed to create session')
        })
    },

    join: async function (sessionId, socket, username) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (session) {
            socket.join(sessionId.toString())
            socket.to(sessionId.toString()).emit('user-connected', username)
            return session
        } else throw new Error('Session not found')
    },

    leave: async function (socket, sessionId, username) {
        if (socket.rooms.has(sessionId.toString())) {
            socket.to(sessionId.toString()).emit('user-disconnected', username)
            socket.leave(sessionId.toString())
        } else throw new Error('Client not connected to any game session')
    },

    set: async function (sessionId, sceneId) {
        await prepareConnection()

        const scene = await sceneModel.findById(sceneId).exec()

        if (scene || !sceneId) {
            const session = await sessionModel.findByIdAndUpdate(sessionId, { $set: { 'state.scene': sceneId } }).exec()
            if (session) return scene
            else throw new Error('Invalid session id')
        } else throw new Error('Invalid scene id')
    },

    sync: async function (sessionId, sync) {
        await prepareConnection()

        const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { 'state.synced': sync } }).exec()
        if (!update) throw new Error('Failed to update sync state')
    }
}