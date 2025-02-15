const { ObjectId } = require("mongodb")
const { create, createFolder } = require("../../modules/blueprint")
const { blueprintModel, lightModel } = require("../../schemas")

module.exports = {
    /**
     * Create-blueprint packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {{}} tokenData
     * @param {{}} lightingData
     * @param {Buffer} imageBuffer
     * @param {Buffer} artBuffer
     * @param {Server} socketServer
     * @param {() => {}} callback
    */
    blueprint: async (accountInfo, sessionId, path, tokenData, lightingData, imageBuffer, artBuffer, socketServer, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-blueprint")
        try {
            tokenData.image = new ObjectId()
            tokenData.art = artBuffer ? new ObjectId() : null
            const model = new blueprintModel(tokenData)
            const lighting = new lightModel(lightingData)

            if (!model.light) model.light = model._id
            lighting._id = model._id

            const id = await create(sessionId, path, model, lighting, imageBuffer, artBuffer)
            callback(true, id)
            if (path.includes("public")) socketServer.to(sessionId.toString()).emit("create-blueprint", id)
        } catch (error) {
            console.error("Failed to create blueprint", error)
            callback(false, error.message)
        }
    },

    /**
     * Create-folder packet listener
     * @param {{ uid: ObjectId, username: string }} accountInfo
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {string} name
     * @param {() => {}} callback
    */
    folder: async (accountInfo, sessionId, path, name, callback) => {
        console.debug(`[ ${accountInfo.username} (${accountInfo.uid}) ]`, "Package: create-blueprint-folder")
        try {
            const id = await createFolder(sessionId, path, name)
            callback(true, id)
        } catch (error) {
            console.error("Failed to create folder", error)
            callback(false, error.message)
        }
    }
}