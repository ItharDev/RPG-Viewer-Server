const { sceneModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { prepareConnection } = require("../database")

module.exports = {
    /**
     * Get-initiatives handler
     * @param {ObjectId} scene
     * @returns {Promise<{}>}
    */
    get: async function (scene) {
        await prepareConnection()

        const data = await sceneModel.findById(scene).exec()
        if (!data) throw new Error("Invalid scene id")

        return data.initiatives
    },

    /**
     * Create-initiative handler
     * @param {ObjectId} scene
     * @param {{name: String, roll: number, visible: boolean}} data
     * @returns {Promise<string>}
    */
    create: async function (scene, data) {
        await prepareConnection()

        const id = new ObjectId().toString()
        data.id = id
        const create = await sceneModel.findByIdAndUpdate(scene, { $set: { [`initiatives.${id}`]: data } }).exec()
        if (!create) throw new Error("Invalid scene id")

        return id
    },

    /**
     * Modify-initiative handler
     * @param {ObjectId} scene
     * @param {string} id
     * @param {{name: String, roll: number, visible: boolean}} data
     * @returns {Promise<void>}
    */
    modify: async function (scene, id, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { [`initiatives.${id}`]: data } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Remove-initiative handler
     * @param {ObjectId} scene
     * @param {string} id
     * @returns {Promise<void>}
    */
    remove: async function (scene, id) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { [`initiatives.${id}`]: undefined } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * reset-initiatives handler
     * @param {ObjectId} scene
     * @returns {Promise<void>}
    */
    reset: async function (scene) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "initiatives": {} } }).exec()
        if (!update) throw new Error("Invalid scene id")
    }
}