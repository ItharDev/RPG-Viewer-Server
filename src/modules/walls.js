const { sceneModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { prepareConnection } = require("../database")

module.exports = {
    /**
     * Create-wall handler
     * @param {ObjectId} scene
     * @param {{id: ObjectId, points: Array<{x: number, y: number}>, type: number, open: boolean, locked: boolean}} data
     * @returns {Promise<void>}
    */
    create: async function (scene, data) {
        await prepareConnection()

        const create = await sceneModel.findByIdAndUpdate(scene, { $addToSet: { walls: data } }).exec()
        if (!create) throw new Error("Failed to create wall")
    },

    /**
     * Modify-wall handler
     * @param {ObjectId} scene
     * @param {{id: ObjectId, points: Array<{x: number, y: number}>, type: number, open: boolean, locked: boolean}} data
     * @returns {Promise<void>}
    */
    modify: async function (scene, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "walls.$[element]": data } }, { arrayFilters: [{ "element.id": data.id }] }).exec()
        if (!update) throw new Error("Failed to modify wall")
    },

    /**
     * Remove-wall handler
     * @param {ObjectId} scene
     * @param {ObjectId} id
     * @returns {Promise<void>}
    */
    remove: async function (scene, id) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $pull: { walls: { id: id } } }).exec()
        if (!update) throw new Error("Failed to remove wall")
    }
}