const { userModel, sessionModel, sceneModel } = require("../schemas")
const { ObjectId } = require("mongodb")
const { connect } = require("mongoose")
const bcrypt = require("bcrypt")

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
     * @returns {Promise<string>}
    */
    get: async function (uid) {
        await prepareConnection()

        const account = await userModel.findById(uid).exec()
        if (!account) throw new Error("Failed to load user data")

        return account.name
    },

    /**
     * Register handler
     * @param {{email: string, name: string, password: string, licences: Array}} userData
     * @returns {Promise<string>}
    */
    register: async function (userData) {
        await prepareConnection()

        if (!validateEmail(userData.email)) throw new Error("Invalid email address")

        const hash = await bcrypt.hash(userData.password, 10)
        userData.password = hash;

        const duplicate = await userModel.findOne({ email: userData.email }).exec()
        if (duplicate) throw new Error("User with this email already exists")

        const result = await userModel.create(userData)
        if (!result) throw new Error("Failed to register user")

        return result._id.toString()
    },

    /**
     * Sign-in handler
     * @param {ObjectId | null} uid
     * @param {string | null} email
     * @param {string | null} password
     * @returns {Promise<userModel>}
    */
    signIn: async function (uid, email, password) {
        await prepareConnection()

        if (uid) {
            const user = await userModel.findById(uid).exec()
            if (!user) throw new Error("Invalid or unknown user id")

            return user
        }

        const user = await userModel.findOne({ email: email }).exec()
        if (!user) throw new Error("Invalid email address")
	
        const match = await bcrypt.compare(password, user.password)
        if (!match) throw new Error("Invalid password")

        return user
    },

    /**
     * Change-name handler
     * @param {ObjectId | null} uid
     * @param {string | null} name
     * @returns {Promise<void>}
    */
    changeName: async function (uid, name) {
        await prepareConnection()

        const result = await userModel.findByIdAndUpdate(uid, { $set: { name: name } }).exec()
        if (!result) throw new Error("Account not found")
    },

    /**
     * Validate-licence handler
     * @param {ObjectId} key
     * @param {ObjectId} uid
     * @returns {Promise<string>}
    */
    validateLicence: async function (key, uid) {
        await prepareConnection()

        const session = await sessionModel.findById(key).exec()
        if (!session) throw new Error("Invalid or unknown key")

        if (session.master.toString() !== uid.toString()) {
            const folderStructure = {
                shared: {
                    name: "Shared",
                    folders: {},
                    contents: []
                }
            }
            await sessionModel.findByIdAndUpdate(key, { $addToSet: { users: uid } }).exec()
            await sessionModel.findByIdAndUpdate(key, { $set: { [`journals.${uid.toString()}`]: { name: uid.toString(), folders: folderStructure, contents: [] } } }).exec()
        }

        const result = await userModel.findByIdAndUpdate(uid, { $addToSet: { licences: key } }).exec()
        if (!result) throw new Error("Failed to update licence directory")

        return session.name
    },

    /**
     * Load-licences handler
     * @param {ObjectId} uid
     * @returns {Promise<Array>}
    */
    loadLicences: async function (uid) {
        await prepareConnection()

        const user = await userModel.findById(uid).exec()
        if (!user) throw new Error("User not found")

        let licences = []
        for (const key of user.licences) {
            const session = await sessionModel.findById(key)
            if (session) licences.push({ id: key, name: session.name })
            else await userModel.findByIdAndUpdate(uid, { $pull: { licences: key } }).exec()
        }

        return licences
    },

    /**
     * Remove-licences handler
     * @param {ObjectId} uid
     * @returns {Promise<void>}
    */
    removeLicences: async function (uid) {
        await prepareConnection()

        const user = await userModel.findById(uid).exec()
        if (!user) throw new Error("User not found")

        let licencesToRemove = []
        for (const element of user.licences) {
            const session = await sessionModel.findById(element).exec()
            if (session.master.equals(uid)) continue

            licencesToRemove.push(element)
        }

        const update = await userModel.findByIdAndUpdate(uid, { $pullAll: { licences: licencesToRemove } }).exec()
        if (!update) throw new Error("Failed to remove licences")
    }
}
