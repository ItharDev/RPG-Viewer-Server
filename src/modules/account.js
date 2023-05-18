const { userModel, sessionModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { connect } = require("mongoose")
const bcrypt = require("bcrypt")

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

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
}
module.exports = {
    /**
     * Get-user handler
     * @param {ObjectId} uid
     * @returns {Promise<string>} user id
    */
    get: async function (uid) {
        await prepareConnection()

        const account = await userModel.findById(uid).exec()
        if (account) return account
        else throw new Error("Failed to load user data")
    },

    /**
     * Register handler
     * @param {{email: string, name: string, password: string, licences: Array}} userData
     * @returns {Promise<string>} user id
    */
    register: async function (userData) {
        await prepareConnection()

        if (!validateEmail(userData.email)) throw new Error("Invalid email address")

        const hash = await bcrypt.hash(userData.password, 10)
        userData.password = hash;

        const duplicate = await userModel.findOne({ email: userData.email }).exec()
        if (duplicate) throw new Error("User with this email already exists")

        const result = await userModel.create(userData)
        if (result) return result._id.toString()
        else throw new Error("Failed to register user")
    },

    /**
     * Sign-in handler
     * @param {string | null} email
     * @param {string | null} password
     * @param {ObjectId | null} uid
     * @returns {Promise<userModel>} user data
    */
    signIn: async function (email, password, uid) {
        await prepareConnection()

        if (uid) {
            const user = await userModel.findById(uid).exec()
            if (user) return user
            else throw new Error("Invalid or unknown user id")
        } else {
            const user = await userModel.findOne({ email: email }).exec()
            if (user) {
                const match = await bcrypt.compare(password, user.password)
                if (match) return user
                else throw new Error("Invalid password")
            }
            else throw new Error("Invalid email address")
        }
    },

    /**
     * Validate-licence handler
     * @param {ObjectId} key
     * @param {ObjectId} uid
     * @returns {Promise<string>} session name
    */
    validateLicence: async function (key, uid) {
        await prepareConnection()

        const session = await sessionModel.findById(key).exec()
        if (session) {
            if (!session.master.equals(uid)) await sessionModel.findByIdAndUpdate(key, { $addToSet: { users: uid } }).exec()
            const result = await userModel.findByIdAndUpdate(uid, { $addToSet: { licences: key } }).exec()
            if (result) return session.name
            else throw new Error("Failed to update licence directory")
        } else throw new Error("Invalid or unknown key")
    },

    /**
     * Load-licences handler
     * @param {ObjectId} uid
     * @returns {Promise<Array>} licences
    */
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
        } else throw new Error("User not found")
    },

    /**
     * Remove-licences handler
     * @param {ObjectId} uid
     * @returns {Promise<void>}
    */
    removeLicences: async function (uid) {
        await prepareConnection()

        const user = await userModel.findById(uid).exec()
        if (user) {
            let licencesToRemove = []
            for (const element of user.licences) {
                const session = await sessionModel.findById(element)
                if (!session.master.equals(uid)) {
                    licencesToRemove.push(element)
                }
            }

            const update = await userModel.findByIdAndUpdate(uid, { $pullAll: { licences: licencesToRemove } }).exec()
            if (!update) throw new Error("Failed to remove licences")
        } else throw new Error("User not found")
    }
}