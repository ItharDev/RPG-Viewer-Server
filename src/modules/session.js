const { sessionModel } = require("../schemas")
const account = require("./account")
const networking = require("./networking")
const { ObjectId } = require("mongodb")
const { prepareConnection } = require("../database")

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
            if (!create) {
                reject("Failed to create session")
                return
            }

            const folderStructure = {
                shared: {
                    name: "Shared",
                    folders: {},
                    contents: []
                }
            }
            await sessionModel.findByIdAndUpdate(create._id, { $set: { [`journals.${master.toString()}`]: { name: master.toString(), folders: folderStructure, contents: [] } } }).exec()

            const licence = await account.validateLicence(create._id, master)
            if (!licence) {
                reject("Failed to validate licence")
                return
            }

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
            else resolve(id)
        })
    },

    /**
     * Get-users handler
     * @param {ObjectId} sessionId
     * @returns {Promise<Array<ObjectId>>}
    */
    getUsers: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Session not found")

        return session.users
    },
}