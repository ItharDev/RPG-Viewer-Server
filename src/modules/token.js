const { ObjectId } = require('mongodb')
const { tokenModel, sceneModel, lightModel } = require('../schemas')
const networking = require('./networking');
const { connect } = require('mongoose');

async function prepareConnection() {
    return new Promise((resolve, reject) => {
        if (global.databaseConnected !== true) {
            connect('mongodb://127.0.0.1:27017/rpg-viewer').then((db) => {
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
     * Get-token handler
     * @param {ObjectId} tokenId
     * @returns {Promise<tokenModel>}
    */
    get: async function (tokenId) {
        const token = await tokenModel.findById(tokenId).exec()
        if (!token) throw new Error('Invalid token id')

        return token
    },

    /**
    * Get-all-tokens handler
    * @param {ObjectId} sceneId
    * @returns {Promise<Array>}
   */
    getAll: async function (sceneId) {
        const scene = await sceneModel.findById(sceneId).exec()
        if (!scene) throw new Error('Invalid scene id')

        let tokens = []
        for (let i = 0; i < scene.tokens.length; i++) {
            const element = scene.tokens[i];
            const token = await tokenModel.findById(element).exec()
            tokens.push(token)
        }

        return tokens
    },

    /**
     * Create-token handler
     * @param {ObjectId} sceneId
     * @param {tokenModel} data
     * @param {lightModel} lightData
     * @returns {Promise<string>}
    */
    create: async function (sceneId, data, lightData) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const token = await tokenModel.create(data)
            if (token) {
                const update = await sceneModel.findByIdAndUpdate(sceneId, { $addToSet: { tokens: token._id } }).exec()
                if (update) {
                    await networking.modifyFile(data.image, 1).then(async (resolved) => {
                        const light = await lightModel.create(lightData)
                        if (!light) reject("Failed to create lighting data")
                        resolve(token._id)
                    }, (rejected) => {
                        reject(rejected)
                    })
                }
                else reject('Failed to update directory')
            } else reject('Failed to create token')
        })
    },

    /**
     * Remove-token handler
     * @param {ObjectId} sceneId 
     * @param {ObjectId} blueprintId 
     * @returns {Promise<void>}
     */
    remove: async function (sceneId, tokenId) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            const token = await tokenModel.findByIdAndDelete(tokenId).exec()
            if (token) {
                const update = await sceneModel.findByIdAndUpdate(sceneId, { $pull: { tokens: token._id } }).exec()
                if (update) {
                    await networking.modifyFile(token.image, -1).then((resolved) => {
                        resolve()
                    }, (rejected) => {
                        reject(rejected)
                    })
                }
                else reject('Failed to update directory')
            } else reject('Failed to remove token')
        })
    },

    /**
     * Move-token handler
     * @param {ObjectId} tokenId
     * @param {{x: Number, y: Number}} position
     * @returns {Promise<void>}
    */
    move: async function (tokenId, position) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { 'position': position } }).exec()
        if (!update) throw new Error('Failed to update token position')
    },

    /**
     * Modify-blueprint handler
     * @param {ObjectId} id
     * @param {{}} data
     * @param {{}} lightData
     * @param {Buffer} buffer
     * @returns {Promise<string>}
    */
    modify: async function (id, data, lightData, buffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            if (buffer) {
                await networking.modifyFile(data.image, -1).then(async (resolved) => {
                    data.image = new ObjectId()
                    await networking.uploadFile(data.image, buffer).then(null, (rejected) => {
                        reject(rejected)
                        return
                    })
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }

            const token = await tokenModel.findOneAndReplace({ "_id": id }, data).exec()
            if (!token) reject("Failed to modify token")

            const light = await lightModel.findOneAndReplace({ "_id": id }, lightData).exec()
            if (!light) reject("Failed to modify lighting data")

            resolve(data.image.toString())
        })
    },

    setVisibility: async function (tokenId, state) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { enabled: state } }).exec()
        if (update) return
        else throw new Error('Failed to update visibility')
    },

    setElevation: async function (tokenId, elevation) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { elevation: elevation } }).exec()
        if (update) return
        else throw new Error('Failed to update elevation')
    },

    setConditions: async function (tokenId, conditions) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { conditions: conditions } }).exec()
        if (update) return
        else throw new Error('Failed to update conditions')
    },

    setRotation: async function (tokenId, rotation) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { rotation: rotation } }).exec()
        if (update) return
        else throw new Error('Failed to update rotation')
    },

    lock: async function (tokenId, state) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { locked: state } }).exec()
        if (update) return
        else throw new Error('Failed to toggle state')
    },

    setHealth: async function (tokenId, health) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { health: health } }).exec()
        if (update) return
        else throw new Error('Failed to update health')
    },
}