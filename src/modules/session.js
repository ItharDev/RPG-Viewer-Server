const { sessionModel, sceneModel } = require("../schemas")
const { connect } = require("mongoose")
const account = require("./account")
const networking = require("./networking")

async function prepareConnection() {
    return new Promise((resolve, reject) => {
        if (global.databaseConnected !== true) {
            connect("mongodb://127.0.0.1:27017/rpg-viewer").then((db) => {
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
    /**
     * Create-session handler
     * @param {ObjectId} master
     * @param {sessionModel} data
     * @param {Buffer} buffer
     * @returns {Promise<void>}
    */
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
                else reject("Failed to validate licence")
            } else reject("Failed to create session")
        })
    },

    /**
     * Join-session handler
     * @param {ObjectId} sessionId
     * @param {import("socket.io").Socket} socket
     * @param {string} username
     * @returns {Promise<sessionModel>}
    */
    join: async function (sessionId, socket, username) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (session) {
            socket.join(sessionId.toString())
            socket.to(sessionId.toString()).emit("user-connected", username)
            return session
        } else throw new Error("Session not found")
    },

    /**
     * Join-session handler
     * @param {ObjectId} sessionId
     * @param {import("socket.io").Socket} socket
     * @param {string} username
     * @returns {Promise<void>}
    */
    leave: async function (sessionId, socket, username) {
        if (socket.rooms.has(sessionId.toString())) {
            socket.to(sessionId.toString()).emit("user-disconnected", username)
            socket.leave(sessionId.toString())
        } else throw new Error("Client not connected to any game session")
    },

    /**
     * Set-scene handler
     * @param {ObjectId} sessionId
     * @param {import("socket.io").Socket} socket
     * @param {string} username
     * @returns {Promise<sceneModel>}
    */
    setScene: async function (sessionId, sceneId) {
        await prepareConnection()

        const scene = await sceneModel.findById(sceneId).exec()

        if (scene || !sceneId) {
            const session = await sessionModel.findByIdAndUpdate(sessionId, { $set: { "state.scene": sceneId } }).exec()
            if (session) return scene
            else throw new Error("Invalid session id")
        } else throw new Error("Invalid scene id")
    },

    /**
     * Sync-session handler
     * @param {ObjectId} sessionId
     * @param {boolean} synced
     * @returns {Promise<void>}
    */
    sync: async function (sessionId, synced) {
        await prepareConnection()

        const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { "state.synced": synced } }).exec()
        if (!update) throw new Error("Failed to update state")
    }
}