const { sessionModel, effectModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { prepareConnection } = require("../database")
const { uploadFile, modifyFile } = require("./networking")

module.exports = {
    /**
     * Get-effect handler
     * @param {ObjectId} effectId
     * @returns {Promise<effectModel>}
    */
    get: async function (effectId) {
        await prepareConnection()

        const effect = await effectModel.findById(effectId).exec()
        if (!effect) throw new Error("Invalid effect id")

        return effect
    },

    /**
     * Create-effect handler
     * @param {ObjectId} sessionId
     * @param {effectModel} data
     * @param {Buffer} imageBuffer
     * @returns {Promise<string>}
    */
    create: async function (sessionId, data, imageBuffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            await uploadFile(data.image, imageBuffer).then(null, (rejected) => {
                reject(rejected)
                return
            })

            const effect = await effectModel.create(data)
            if (!effect) throw new Error("Failed to create preset")

            const update = sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { effects: effect._id } }).exec()
            if (!update) throw new Error("Invalid session id")

            resolve(effect.id)
        })
    },

    /**
     * Remove-effect handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} effectId
     * @returns {Promise<lightModel>}
    */
    remove: async function (sessionId, effectId) {
        await prepareConnection()

        const effect = await effectModel.findById(effectId).exec()
        if (!effect) throw new Error("Invalid effect id")

        const session = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { effects: effectId } }).exec()
        if (!session) throw new Error("Invalid session id")
        
        await effectModel.findByIdAndDelete(effectId).exec()

        return effect
    },

    /**
     * Modify-light handler
     * @param {ObjectId} effectId
     * @param {effectModel} data
     * @param {Buffer} imageBuffer
     * @returns {Promise<string>}
    */
    modify: async function (effectId, data, imageBuffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            if (imageBuffer) {
                await modifyFile(data.image, -1).then(async () => {
                    data.image = new ObjectId()
                    await uploadFile(data.image, imageBuffer).then(null, (rejected) => {
                        reject(rejected)
                        return
                    })
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }

            const effect = await effectModel.findOneAndReplace({ "_id": effectId }, data, { upsert: true }).exec()
            if (!effect) throw new Error("Failed to update effect data")

            resolve(data.image.toString())
        })
    }
}