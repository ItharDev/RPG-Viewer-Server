const { presetModel, sessionModel } = require("../schemas")
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
    create: async function (sessionId, data) {
        await prepareConnection()

        const create = await presetModel.create(data)
        if (create) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $addToSet: { lightingPresets: create._id } }).exec()
            if (update) return create._id
            else throw new Error("Failed to modify preset list")
        }
        else throw new Error("Failed to create preset")
    },

    modify: async function (id, data) {
        await prepareConnection()

        data._id = id
        const replace = await presetModel.replaceOne({ _id: id }, data).exec()
        if (!replace) throw new Error("Failed to replace preset")
    },

    remove: async function (sessionId, id) {
        await prepareConnection()

        const remove = await presetModel.findByIdAndRemove(id).exec()
        if (remove) {
            const update = await sessionModel.findByIdAndUpdate(sessionId, { $pull: { lightingPresets: id } }).exec()
            if (!update) throw new Error("Failed to modify preset list")
        }
        else throw new Error("Failed to remove preset")
    },

    load: async function (id) {
        await prepareConnection()

        const preset = await presetModel.findById(id).exec()
        if (preset) return preset
        else throw new Error("Failed to replace preset")
    }
}