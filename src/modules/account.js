const { userModel, sessionModel, sceneModel } = require('../schemas')
const { ObjectId } = require('mongodb')
const { connect } = require('mongoose')
const bcrypt = require('bcrypt')

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

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
}
module.exports = {
    get: async function (uid) {
        await prepareConnection()

        const account = await userModel.findById(uid).exec()
        if (account) return account
        else throw new Error('Failed to load user data')
    },

    register: async function (data) {
        await prepareConnection()

        if (!validateEmail(data.email)) throw new Error('Invalid email address')

        const hash = await bcrypt.hash(data.password, 10)
        data.password = hash;

        const duplicate = await userModel.findOne({ email: data.email }).exec()
        if (duplicate) throw new Error('User with this email already exists')

        const result = await userModel.create(data)
        if (result) return result._id
        else throw new Error('Failed to register user')
    },

    signIn: async function (email, password, uid) {
        await prepareConnection()

        if (uid) {
            const user = await userModel.findById(ObjectId(uid)).exec()
            if (user) {
                const update = await userModel.findByIdAndUpdate(uid, { $set: { online: true } }).exec()
                for await (const doc of sceneModel.find()) {
                    await sceneModel.findByIdAndUpdate(doc._id, { $set: { 'fogOfWar.requireVision': undefined } }).exec()
                }
                return user
            }
            else throw new Error('Invalid or unknown user id')
        } else {
            const user = await userModel.findOne({ email: email }).exec()
            if (user) {
                const match = await bcrypt.compare(password, user.password)
                await userModel.findByIdAndUpdate(user._id,)
                if (match) {
                    const update = await userModel.findOneAndUpdate({ email: email }, { $set: { online: true } }).exec()
                    return user
                }
                else throw new Error('Invalid password')
            }
            else throw new Error('Invalid email address')
        }
    },

    validateLicence: async function (licenceKey, uid) {
        await prepareConnection()

        const session = await sessionModel.findById(licenceKey).exec()
        if (session) {
            if (!session.master.equals(uid)) await sessionModel.findByIdAndUpdate(licenceKey, { $addToSet: { users: uid } }).exec()
            const result = await userModel.findByIdAndUpdate(uid, { $addToSet: { licences: licenceKey } }).exec()
            if (result) return session.name
            else throw new Error('Failed to update licence directory')
        } else throw new Error('Invalid or unknown key')
    },

    loadLicences: async function (uid) {
        await prepareConnection()

        const user = await userModel.findById(uid).exec()
        if (user) {
            let licences = []
            for (const key of user.licences) {
                const session = await sessionModel.findById(key)
                if (session) licences.push({ id: key, name: session.name })
                else userModel.findByIdAndUpdate(uid, { $pull: { licences: key } })
            }
            return licences
        } else throw new Error('User not found')
    },

    removeLicences: async function (uid) {
        await prepareConnection()

        const user = await userModel.findById(uid).exec()
        if (user) {
            let licences = []
            for (const element of user.licences) {
                const session = await sessionModel.findById(element)
                if (!session.master.equals(uid)) {
                    licences.push(element)
                }
            }

            const update = await userModel.findByIdAndUpdate(uid, { $pullAll: { licences: licences } }).exec()
            if (update) return
            else throw new Error('Failed to remove licences')
        } else throw new Error('User not found')
    }
}