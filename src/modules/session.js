const { sessionModel } = require("../schemas")
const { connect } = require("mongoose")
const account = require("./account")
const networking = require("./networking")
const { ObjectId } = require("mongodb")

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

            await networking.uploadFile(data.background, buffer).then(null, (rejected) => reject(rejected))

            const create = await sessionModel.create(data)
            if (!create) reject("Failed to create session")

            const licence = await account.validateLicence(create._id, master)
            if (!licence) reject("Failed to validate licence")

            resolve()
        })
    },

    /**
     * Join-session handler
     * @param {ObjectId} sessionId
     * @returns {Promise<sessionModel>}
    */
    join: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Session not found")

        return session
    },

    /**
     * Set-scene handler
     * @param {ObjectId} sessionId
     * @param {{scene: ObjectId | null, synced: boolean}} state
     * @returns {Promise<void>}
    */
    setState: async function (sessionId, state) {
        await prepareConnection()

        const session = await sessionModel.findByIdAndUpdate(sessionId, { $set: { "state": state } }).exec()
        if (!session) throw new Error("Invalid session id")
    },

    /**
     * change-langing-page handler
     * @param {ObjectId} sessionId
     * @param {Buffer} buffer
     * @returns {Promise<string>}
    */
    changeImage: async function (sessionId, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()
            
            const session = await sessionModel.findById(sessionId).exec()
            if (!session) throw new Error("Session not found")

            await networking.modifyFile(session.background, -1)
            const id = new ObjectId()
            await networking.uploadFile(id, buffer).then(null, (rejected) => reject(rejected))

            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { "background": id } }).exec()
            if (!update) reject("Operation failed")

            resolve(id)
        })
    }
}