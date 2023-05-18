const { sceneModel } = require("../schemas")
const { connect } = require("mongoose")
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
     * Create-wall handler
     * @param {ObjectId} scene
     * @param {{wallId: ObjectId, points: Array<{x: number, y: number}>, model: number, open: boolean, locked: boolean}} data
     * @returns {Promise<void>}
    */
    create: async function (scene, data) {
        await prepareConnection()

        const create = await sceneModel.findByIdAndUpdate(scene, { $addToSet: { walls: data } }).exec()
        if (!create) reject("Failed to create wall")
    },

    /**
     * Modify-wall handler
     * @param {ObjectId} scene
     * @param {{wallId: ObjectId, points: Array<{x: number, y: number}>, model: number, open: boolean, locked: boolean}} data
     * @returns {Promise<void>}
    */
    modify: async function (scene, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "walls.$[element]": data } }, { arrayFilters: [{ 'element.wallId': data.wallId }] }).exec()
        if (!create) reject("Failed to create wall")
    },

    /**
     * Remove-wall handler
     * @param {ObjectId} scene
     * @param {ObjectId} wallId
     * @returns {Promise<void>}
    */
    remove: async function (scene, wallId) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $pull: { walls: { wallId: wallId } } }).exec()
        if (!update) reject("Failed to remove wall")
    }
}