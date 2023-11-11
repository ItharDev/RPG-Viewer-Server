const { sceneModel, sessionModel, lightModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { connect } = require("mongoose")

async function prepareConnection() {
    return new Promise((resolve, reject) => {
        if (global.databaseConnected !== true) {
            connect("mongodb://127.0.0.1:27017/rpg-viewer-dev").then((db) => {
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
     * Get-light handler
     * @param {ObjectId} lightId
     * @returns {Promise<lightModel>}
    */
    get: async function (lightId) {
        await prepareConnection()

        const light = await lightModel.findById(lightId).exec()
        if (!light) throw new Error("Invalid light id")

        return light
    },

    /**
     * Create-light handler
     * @param {ObjectId} sceneId
     * @param {lightModel} data
     * @param {{}} info
     * @returns {Promise<string>}
    */
    create: async function (sceneId, data, info) {
        await prepareConnection()

        const light = await lightModel.create(data)
        if (!light) throw new Error("Failed to create light")
        const update = sceneModel.findByIdAndUpdate(sceneId, { $set: { [`lights.${light.id}`]: info } }).exec()
        if (!update) throw new Error("Invalid scene id")

        return light.id
    },

    /**
     * Create-preset handler
     * @param {ObjectId} sessionId
     * @param {lightModel} data
     * @returns {Promise<string>}
    */
    createPreset: async function (sessionId, data) {
        await prepareConnection()

        const light = await lightModel.create(data)
        if (!light) throw new Error("Failed to create preset")

        const update = sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { presets: light._id } }).exec()
        if (!update) throw new Error("Invalid session id")

        return light._id
    },

    /**
     * Remove-light handler
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @returns {Promise<void>}
    */
    remove: async function (sceneId, lightId) {
        await prepareConnection()

        const update = sceneModel.findByIdAndUpdate(sceneId, { $unset: { [`lights.${lightId.toString()}`]: "" } }).exec()
        if (!update) throw new Error("Invalid scene id")

        const light = await lightModel.findByIdAndRemove(lightId).exec()
        if (!light) throw new Error("Invalid light id")
    },

    /**
     * Remove-preset handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} presetId
     * @returns {Promise<lightModel>}
    */
    removePreset: async function (sessionId, presetId) {
        await prepareConnection()

        const preset = lightModel.findById(presetId).exec()
        const session = sessionModel.findByIdAndUpdate(sessionId, { $pull: { presets: presetId } }).exec()
        if (!session) throw new Error("Invalid session id")

        return preset
    },

    /**
     * Modify-light handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {{}} info
     * @param {{}} data
     * @returns {Promise<void>}
    */
    modify: async function (sessionId, sceneId, lightId, info, data) {
        await prepareConnection()
        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        if (!session.presets.includes(info.id)) {
            info.id = lightId
        }

        const light = await lightModel.findOneAndReplace({ "_id": lightId }, data).exec()
        if (!light) throw new Error("Failed to update light data")

        const scene = sceneModel.findByIdAndUpdate(sceneId, { $set: { [`lights.${lightId}`]: info } }).exec()
        if (!scene) throw new Error("Invalid scene id")
    },

    /**
     * Move-light handler
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {{}} data
     * @returns {Promise<void>}
    */
    move: async function (sceneId, lightId, data) {
        await prepareConnection()

        const update = sceneModel.findByIdAndUpdate(sceneId, { $set: { [`lights.${lightId}`]: data } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Toggle-light handler
     * @param {ObjectId} sceneId
     * @param {ObjectId} lightId
     * @param {boolean} enabled
     * @returns {Promise<void>}
    */
    toggle: async function (sceneId, lightId, enabled) {
        await prepareConnection()

        const update = sceneModel.findByIdAndUpdate(sceneId, { $set: { [`lights.${lightId}.enabled`]: enabled } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Modify-preset handler
     * @param {ObjectId} lightId
     * @param {{}} data
     * @returns {Promise<void>}
    */
    modifyPreset: async function (lightId, data) {
        await prepareConnection()

        const light = await lightModel.findOneAndReplace({ "_id": lightId }, data).exec()
        if (!light) throw new Error("Failed to modify preset")
    },
}