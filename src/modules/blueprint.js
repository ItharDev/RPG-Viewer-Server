const { blueprintModel, sessionModel, lightModel, tokenModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { connect } = require("mongoose")
const networking = require("./networking")
const getFolder = require("./getFolder")

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
     * Get-blueprint handler
     * @param {ObjectId} blueprintId
     * @returns {Promise<blueprintModel>}
    */
    get: async function (blueprintId) {
        await prepareConnection()

        const blueprint = await blueprintModel.findById(blueprintId).exec()
        if (!blueprint) throw new Error("Invalid blueprint id")

        return blueprint
    },

    /**
     * Get-all-blueprints handler
     * @param {ObjectId} sessionId
     * @returns {Promise<{}>}
    */
    getAll: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        return session.blueprints
    },

    /**
     * Get-public-blueprints handler
     * @param {ObjectId} sessionId
     * @returns {Promise<{}>}
    */
    getPublic: async function (sessionId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        return session.blueprints["folders"]["public"]
    },

    /**
     * Create-blueprint handler
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {blueprintModel} data
     * @param {lightModel} lightData
     * @param {Buffer} imageBuffer
     * @param {Buffer} artBuffer
     * @returns {Promise<string>}
    */
    create: async function (sessionId, path, data, lightData, imageBuffer, artBuffer) {
        return new Promise(async (resolve, reject) => {
            await prepareConnection()

            await networking.uploadFile(data.image, imageBuffer).then(null, (rejected) => {
                reject(rejected)
                return
            })

            if (artBuffer) await networking.uploadFile(data.art, artBuffer).then(null, (rejected) => {
                reject(rejected)
                return
            })

            const session = await sessionModel.findById(sessionId).exec()
            if (!session) {
                reject("Invalid session id")
                return
            }

            const blueprint = await blueprintModel.create(data)
            if (!blueprint) {
                reject("Failed to create blueprint")
                return
            }

            const targetFolder = await getFolder(session.blueprints, path)
            if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.folders.${targetFolder.path}.contents`]: blueprint._id } }).exec()
            else await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.contents`]: blueprint._id } }).exec()

            const light = await lightModel.create(lightData)
            if (!light) {
                reject("Failed to create lighting data")
                return
            }

            resolve(blueprint.id)
        })
    },

    /**
     * Modify-blueprint handler
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
                await networking.modifyFile(data.image, -1).then(async () => {
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
                await networking.modifyFile(data.art, -1).then(async () => {
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

            const blueprint = await blueprintModel.findOneAndReplace({ "_id": id }, data, { new: true }).exec()
            if (!blueprint) {
                reject("Failed to modify blueprint")
                return
            }

            const light = await lightModel.findOneAndReplace({ "_id": id }, lightData, { upsert: true }).exec()
            if (!light) {
                reject("Failed to modify lighting data")
                return
            }

            if (blueprint.synced) {
                const token = await tokenModel.updateMany(
                    { "parentInstance": id },
                    { $set: { ...data } },
                ).exec()
                if (!token) {
                    reject("Failed to modify token")
                    return
                }
            }
            resolve({ image: data.image.toString(), art: data.art.toString() })
        })
    },

    /**
     * Sync-blueprint handler
     * @param {ObjectId} sessionId
     * @param {ObjectId} id
     * @param {boolean} synced
     */
    sync: async function (sessionId, id, synced) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const blueprint = await blueprintModel.findByIdAndUpdate(id, { $set: { "synced": synced } }).exec()
        if (!blueprint) throw new Error("Invalid blueprint id")
    },

    /**
     * Remove-blueprint handler
     * @param {ObjectId} sessionId 
     * @param {string} path 
     * @param {ObjectId} blueprintId 
     * @returns {Promise<void>}
     */
    remove: async function (sessionId, path, blueprintId) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const targetFolder = await getFolder(session.blueprints, path)
        if (targetFolder) await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.folders.${targetFolder.path}.contents`]: blueprintId } }).exec()
        else await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.contents`]: blueprintId } }).exec()

        const blueprint = await blueprintModel.findByIdAndDelete(blueprintId).exec()
        if (!blueprint) throw new Error("Failed to remove blueprint")

        await networking.modifyFile(blueprint.image, -1)
        if (blueprint.art) await networking.modifyFile(blueprint.art, -1)
    },

    /**
     * Move-blueprint handler
     * @param {ObjectId} sessionId 
     * @param {ObjectId} blueprintId 
     * @param {string} oldPath 
     * @param {string} newPath 
     * @returns {Promise<void>}
     */
    move: async function (sessionId, blueprintId, oldPath, newPath) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const oldFolder = await getFolder(session.blueprints, oldPath)

        let pull
        let push

        if (!oldPath) pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.contents`]: blueprintId } }).exec()
        else pull = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { [`blueprints.folders.${oldFolder.path}.contents`]: blueprintId } }).exec()
        if (!pull) throw new Error("Failed to pull blueprint from old location")

        const newState = await sessionModel.findById(sessionId).exec()
        const newFolder = await getFolder(newState.blueprints, newPath)

        if (!newPath) push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.contents`]: blueprintId } }).exec()
        else push = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { [`blueprints.folders.${newFolder.path}.contents`]: blueprintId } }).exec()

        if (!push) throw new Error("Failed to push blueprint to new location")
    },

    /**
     * Create-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} path 
     * @param {string} name 
     * @returns {Promise<string>}
     */
    createFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const id = new ObjectId().toString()
        const data = {
            name: name,
            folders: {},
            contents: []
        }

        const targetFolder = await getFolder(session.blueprints, path)
        if (targetFolder) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${targetFolder.path}.folders.${id}`]: data } }).exec()
            if (!update) throw new Error("Failed to create folder")
        } else {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${id}`]: data } }).exec()
            if (!update) throw new Error("Failed to create folder")
        }

        return id
    },

    /**
     * Remove-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} path 
     * @returns {Promise<void>}
     */
    removeFolder: async function (sessionId, path) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const oldFolder = await getFolder(session.blueprints, path)
        for (let i = 0; i < oldFolder.contents.length; i++) {
            await module.exports.remove(sessionId, path, oldFolder.contents[i])
        }

        let paths = path.split("/")
        const folderId = paths.pop()

        const targetFolder = await getFolder(session.blueprints, paths.join("/"))
        if (targetFolder) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`blueprints.folders.${targetFolder.path}.folders.${folderId}`]: "" } }).exec()
            if (!update) throw new Error("Failed to remove folder")
        } else {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`blueprints.folders.${folderId}`]: "" } }).exec()
            if (!update) throw new Error("Failed to remove folder")
        }
    },

    /**
     * Rename-folder handler
     * @param {ObjectId} sessionId
     * @param {string} path
     * @param {string} name
     * @returns {Promise<void>}
     */
    renameFolder: async function (sessionId, path, name) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        const targetFolder = await getFolder(session.blueprints, path)
        if (!targetFolder) throw new Error("Target folder not found")

        const update = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${targetFolder.path}.name`]: name } }).exec()
        if (!update) throw new Error("Failed to rename folder")
    },

    /**
     * Move-folder handler
     * @param {ObjectId} sessionId 
     * @param {string} oldPath 
     * @param {string} newPath 
     * @returns {Promise<void>}
     */
    moveFolder: async function (sessionId, oldPath, newPath) {
        await prepareConnection()

        const session = await sessionModel.findById(sessionId).exec()
        if (!session) throw new Error("Invalid session id")

        let oldPaths = oldPath.split("/")
        const oldId = oldPaths.pop()

        let pull
        let push

        const oldFolder = await getFolder(session.blueprints, oldPaths.join("/"))
        if (oldFolder) pull = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`blueprints.folders.${oldFolder.path}.folders.${oldId}`]: "" } }).exec()
        else pull = await sessionModel.findByIdAndUpdate(sessionId, { $unset: { [`blueprints.folders.${oldId}`]: "" } }).exec()
        if (!pull) throw new Error("Failed to pull the folder from old location")

        const newState = await sessionModel.findById(sessionId).exec()
        const newFolder = await getFolder(newState.blueprints, newPath)

        if (newFolder) {
            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${newFolder.path}.folders.${oldId}`]: oldFolder.folders[oldId] } }).exec()
            else push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${newFolder.path}.folders.${oldId}`]: session.blueprints.folders[oldId] } }).exec()
        } else {
            if (oldFolder) push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${oldId}`]: oldFolder.folders[oldId] } }).exec()
            else push = await sessionModel.findByIdAndUpdate(sessionId, { $set: { [`blueprints.folders.${oldId}`]: session.blueprints.folders[oldId] } }).exec()
        }
        if (!push) throw new Error("Failed to push the folder to new location")
    }
}