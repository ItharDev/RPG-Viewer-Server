const { ObjectId } = require("mongodb")
const { tokenModel, sceneModel, lightModel, sessionModel } = require("../schemas")
const networking = require("./networking");
const { connect } = require("mongoose");

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
     * Get-token handler
     * @param {ObjectId} tokenId
     * @returns {Promise<tokenModel>}
    */
    get: async function (tokenId) {
        const token = await tokenModel.findById(tokenId).exec()
        if (!token) throw new Error("Invalid token id")

        return token
    },

    /**
    * Get-all-tokens handler
    * @param {ObjectId} sceneId
    * @returns {Promise<Array>}
   */
    getAll: async function (sceneId) {
        const scene = await sceneModel.findById(sceneId).exec()
        if (!scene) throw new Error("Invalid scene id")

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
                        if (!light) return reject("Failed to create lighting data")

                        if (data.art) await networking.modifyFile(data.art, 1).then(async (resolved) => {
                            resolve(token._id)
                        }, (rejected) => {
                            reject(rejected)
                        })
                        else resolve(token._id)
                    }, (rejected) => {
                        reject(rejected)
                    })
                }
                else reject("Failed to update directory")
            } else reject("Failed to create token")
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
                const update = await sceneModel.findByIdAndUpdate(sceneId, {
                    $pull: {
                        tokens: token._id,
                        "groupOne.tokens": token._id,
                        "groupTwo.tokens": token._id,
                        "groupThree.tokens": token._id
                    }
                }).exec()
                if (update) {
                    await networking.modifyFile(token.image, -1).then(null, (rejected) => {
                        reject(rejected)
                    })
                    if (token.art) await networking.modifyFile(token.art, -1).then(null, (rejected) => {
                        reject(rejected)
                    })

                    resolve()
                }
                else reject("Failed to update directory")
            } else reject("Failed to remove token")
        })
    },

    /**
     * Move-token handler
     * @param {ObjectId} tokenId
     * @param {{x: Number, y: Number}} position
     * @param {boolean} isTeleport
     * @returns {Promise<void>}
    */
    move: async function (tokenId, position, isTeleport) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { "position": position, "teleportProtection": isTeleport } }).exec()
        if (!update) throw new Error("Failed to update token position")
    },

    /**
     * Modify-token handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} id
     * @param {{}} data
     * @param {{}} lightData
     * @param {Buffer} imageBuffer
     * @param {Buffer} artBuffer
     * @returns {Promise<{image: string, art: string}>}
    */
    modify: async function (sessionId, id, data, lightData, imageBuffer, artBuffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            if (imageBuffer) {
                await networking.modifyFile(data.image, -1).then(async (resolved) => {
                    data.image = new ObjectId()
                    await networking.uploadFile(data.image, imageBuffer).then(null, (rejected) => {
                        reject(rejected)
                        return
                    })
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }

            if (artBuffer) {
                await networking.modifyFile(data.art, -1).then(async (resolved) => {
                    data.art = new ObjectId()
                    await networking.uploadFile(data.art, artBuffer).then(null, (rejected) => {
                        reject(rejected)
                        return
                    })
                }, (rejected) => {
                    reject(rejected)
                    return
                })
            }

            const session = await sessionModel.findById(sessionId).exec()
            if (!session) throw new Error("Invalid session id")

            if (!session.presets.includes(data.light)) {
                data.light = id
            }

            const token = await tokenModel.findOneAndReplace({ "_id": id }, data).exec()
            if (!token) reject("Failed to modify token")

            const light = await lightModel.findOneAndReplace({ "_id": id }, lightData, { upsert: true }).exec()
            if (!light) reject("Failed to modify lighting data")

            resolve({ image: data.image.toString(), art: data.art.toString() })
        })
    },

    /**
     * Update-visibility handler
     * @param {ObjectId} id
     * @param {boolean} state
     * @returns {Promise<void>}
    */
    setVisibility: async function (tokenId, state) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(tokenId, { $set: { enabled: state } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Update-elevation handler
     * @param {ObjectId} id
     * @param {boolean} value
     * @returns {Promise<void>}
    */
    setElevation: async function (id, value) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { elevation: value } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Update-conditions handler
     * @param {ObjectId} id
     * @param {Number} conditions
     * @returns {Promise<void>}
    */
    setConditions: async function (id, conditions) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { conditions: conditions } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Rotate-token handler
     * @param {ObjectId} id
     * @param {Number} rotation
     * @returns {Promise<void>}
    */
    setRotation: async function (id, rotation) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { rotation: rotation } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Rotate-token-light handler
     * @param {ObjectId} id
     * @param {Number} rotation
     * @returns {Promise<void>}
    */
    setLightRotation: async function (id, rotation) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { lightRotation: rotation } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Toggle-token-light handler
     * @param {ObjectId} id
     * @param {boolean} enabled
     * @returns {Promise<void>}
    */
    toggleLight: async function (id, enabled) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { lightEnabled: enabled } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Lock-token handler
     * @param {ObjectId} id
     * @param {boolean} state
     * @returns {Promise<void>}
    */
    lock: async function (id, state) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { locked: state } }).exec()
        if (!update) throw new Error("Invalid token id")
    },

    /**
     * Group-token handler
     * @param {ObjectId} sceneId
     * @param {ObjectId[]} tokens
     * @param {number} groupNumber
     * @returns {Promise<void>}
    */
    group: async function (sceneId, tokens, groupNumber) {
        await prepareConnection()

        let group = ""
        switch (groupNumber) {
            case 1:
                group = "groupOne"
                break
            case 2:
                group = "groupTwo"
                break
            case 3:
                group = "groupThree"
                break
            default:
                throw new Error("Invalid group number")
        }

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $push: { [`${group}.tokens`]: tokens } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Clear-group handler
     * @param {ObjectId} sceneId
     * @param {number} groupNumber
     * @returns {Promise<void>}
     */
    clearGroup: async function (sceneId, groupNumber) {
        await prepareConnection()

        let group = ""
        switch (groupNumber) {
            case 1:
                group = "groupOne"
                break
            case 2:
                group = "groupTwo"
                break
            case 3:
                group = "groupThree"
                break
            default:
                throw new Error("Invalid group number")
        }

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { [`${group}.tokens`]: [] } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Clear-group handler
     * @param {ObjectId} sceneId
     * @param {number} groupNumber
     * @param {boolean} state
     * @returns {Promise<void>}
     */
    toggleGroup: async function (sceneId, groupNumber, state) {
        await prepareConnection()

        let group = ""
        switch (groupNumber) {
            case 1:
                group = "groupOne"
                break
            case 2:
                group = "groupTwo"
                break
            case 3:
                group = "groupThree"
                break
            default:
                throw new Error("Invalid group number")
        }

        const update = await sceneModel.findByIdAndUpdate(sceneId, { $set: { [`${group}.selected`]: state } }).exec()
        if (!update) throw new Error("Invalid scene id")
    },

    /**
     * Update-health handler
     * @param {ObjectId} id
     * @param {boolean} state
     * @returns {Promise<void>}
    */
    setHealth: async function (id, value) {
        await prepareConnection()

        const update = await tokenModel.findByIdAndUpdate(id, { $set: { health: value } }).exec()
        if (!update) throw new Error("Invalid token id")
    },
}