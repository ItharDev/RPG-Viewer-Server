const { sceneModel, tokenModel } = require("../schemas")
const { connect } = require("mongoose")
const { ObjectId } = require("mongodb")
const { move } = require("./token")

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
     * Create-portal handler
     * @param {ObjectId} scene 
     * @param {{x: number, y: number}} position
     * @param {number} radius
     */
    create: async function (scene, position, radius) {
        await prepareConnection()
        const data = {
            id: new ObjectId(),
            position: position,
            link: null,
            radius: radius,
            continuous: false,
            active: false
        }

        const create = await sceneModel.findByIdAndUpdate(scene, { $addToSet: { portals: data } }).exec()
        if (!create) throw new Error("Portal not found")

        return data
    },

    modify: async function (scene, id, data) {
        await prepareConnection()

        if (!data.link) data.link = null
        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "portals.$[element]": data } }, { arrayFilters: [{ "element.id": id }] }).exec()
        if (!update) throw new Error("Portal not found")
    },

    /**
     * Move-portal handler
     * @param {ObjectId} scene
     * @param {ObjectId} id
     * @param {{x: number, y: number}} data 
     */
    move: async function (scene, id, data) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "portals.$[element].position": data } }, { arrayFilters: [{ "element.id": id }] }).exec()
        if (!update) throw new Error("Portal not found")
    },

    /**
     * Link-portal handler
     * @param {ObjectId} scene 
     * @param {ObjectId} source 
     * @param {ObjectId} destination 
     */
    link: async function (scene, source, destination) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "portals.$[element].link": destination } }, { arrayFilters: [{ "element.id": source }] }).exec()
        if (!update) throw new Error("Source or destination portal not found")
    },
    /**
     * Remove-portal handler
     * @param {ObjectId} scene 
     * @param {ObjectId} id 
     */
    remove: async function (scene, id) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $pull: { portals: { id: id } } }).exec()
        if (!update) throw new Error("Portal not found")
    },

    /**
     * Activate-portal handler
     * @param {ObjectId} scene 
     * @param {ObjectId} id 
     * @param {boolean} state 
     */
    activate: async function (scene, id, state) {
        await prepareConnection()

        const update = await sceneModel.findByIdAndUpdate(scene, { $set: { "portals.$[element].active": state } }, { arrayFilters: [{ "element.id": id }] }).exec()
        if (!update) throw new Error("Portal not found")
    },

    /**
     * Enter-portal handler
     * @param {ObjectId} scene 
     * @param {ObjectId} tokenId 
     * @param {ObjectId} portalId 
     */
    enter: async function (scene, tokenId, portalId) {
        await prepareConnection()

        const sceneData = await sceneModel.findById(scene).exec()
        if (!sceneData) throw new Error("Scene not found")

        const source = sceneData.portals.find((portal) => portal.id.equals(portalId))
        if (!source) throw new Error("Source portal not found")

        const destination = sceneData.portals.find((portal) => portal.id.equals(source.link))
        if (!destination) throw new Error("Destination portal not found")

        move(tokenId, destination.position, true)

        return destination.position
    }
}