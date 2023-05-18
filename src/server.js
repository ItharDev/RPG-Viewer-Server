// Dependencies
const { createServer } = require("http")
const { ObjectId } = require("mongodb")
const socketIo = require("socket.io")

// Modules
const networking = require("./modules/networking")

// Listeners (for packets)
const disconnectListener = require("./listeners/disconnect")
const downloadImage = require("./listeners/downloadImage")
const getUser = require("./listeners/account/getUser")
const register = require("./listeners/account/register")
const signIn = require("./listeners/account/signIn")
const signOut = require("./listeners/account/signOut")
const validateLicense = require("./listeners/license/validateLicence")
const loadLicences = require("./listeners/license/loadLicences")
const removeLicences = require("./listeners/license/removeLicences")
const createSession = require("./listeners/session/createSession")
const joinSession = require("./listeners/session/joinSession")
const leaveSession = require("./listeners/session/leaveSession")

// Get environment variables
require("dotenv").config()

// Server configuration (use .env file)
const port = process.env.PORT ?? 3000
const socketPingInterval = process.env.SOCKET_PING_INTERVAL ?? 10000
const socketPingTimeout = process.env.SOCKET_PING_TIMEOUT ?? 120000
const socketMaxBufferSize = process.env.SOCKET_MAX_BUFFER_SIZE ?? 1e8

// Create the HTTP server
const httpServer = createServer()
const socketServer = socketIo(httpServer, {
    pingInterval: socketPingInterval,
    pingTimeout: socketPingTimeout,
    maxHttpBufferSize: socketMaxBufferSize
})

// Socket server connection handling
socketServer.use((socket, next) => {
    if (socket.handshake.query.token === "UNITY") next()
    else next(new Error("Authentication error"))
})

socketServer.on("connection", (socket) => {
    // Stateful data
    const accountInfo = {
        uid: ObjectId,
        username: String
    }
    const sessionInfo = {
        id: ObjectId,
        master: ObjectId,
        isMaster: Boolean,
        synced: Boolean,
        scene: ObjectId,
        users: Array,
        background: ObjectId
    }

    // Listener handling
    socket.on("disconnect", disconnectListener(accountInfo, sessionInfo, socketServer))
    socket.on("download-image", (imageId, callback) => downloadImage(accountInfo, imageId, callback))
    socket.on("get-user", (uid, callback) => getUser(accountInfo, uid, callback))
    socket.on("register", (email, name, password, callback) => register(accountInfo, email, name, password, callback))
    socket.on("sign-in", (email, password, uid, callback) => signIn(accountInfo, email, password, uid, callback))
    socket.on("sign-out", (callback) => signOut(accountInfo, callback))
    socket.on("validate-licence", (licence, callback) => validateLicense(accountInfo, licence, callback))
    socket.on("load-licences", (callback) => loadLicences(accountInfo, callback))
    socket.on("remove-licences", (callback) => removeLicences(accountInfo, callback))
    socket.on("create-session", (name, buffer, callback) => createSession(accountInfo, name, buffer, callback))
    socket.on("join-session", (sessionId, callback) => joinSession(accountInfo, sessionInfo, socket, sessionId, callback))
    socket.on("leave-session", (callback) => leaveSession(accountInfo, sessionInfo, socket, socketServer, callback))
})

// Start everything
async function main() {
    try {
        await networking.startDatabase()
        httpServer.listen(port, console.log("Server listening on port", port))
    } catch (error) {
        console.error("Failed to start server", error)
    }
}
main()
