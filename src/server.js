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
const getUsers = require("./listeners/session/getUsers")
const register = require("./listeners/account/register")
const signIn = require("./listeners/account/signIn")
const signOut = require("./listeners/account/signOut")

const validateLicense = require("./listeners/licence/validateLicence")
const loadLicences = require("./listeners/licence/loadLicences")
const removeLicences = require("./listeners/licence/removeLicences")

const createSession = require("./listeners/session/createSession")
const joinSession = require("./listeners/session/joinSession")
const leaveSession = require("./listeners/session/leaveSession")
const setState = require("./listeners/session/setState")
const changeImage = require("./listeners/session/changeImage")

const createWall = require("./listeners/walls/createWall")
const modifyWall = require("./listeners/walls/modifyWall")
const removeWall = require("./listeners/walls/removeWall")

const createScene = require("./listeners/scenes/createScene")
const getScene = require("./listeners/scenes/getScene")
const moveScene = require("./listeners/scenes/moveScene")
const removeScene = require("./listeners/scenes/removeScene")
const renameScene = require("./listeners/scenes/renameScene")
const modifyGrid = require("./listeners/scenes/modifyGrid")

const createBlueprint = require("./listeners/blueprints/createBlueprint")
const modifyBlueprint = require("./listeners/blueprints/modifyBlueprint")
const getBlueprint = require("./listeners/blueprints/getBlueprint")
const moveBlueprint = require("./listeners/blueprints/moveBlueprint")
const removeBlueprint = require("./listeners/blueprints/removeBlueprint")
const renameBlueprintFolder = require("./listeners/blueprints/renameBlueprintFolder")

const ping = require("./listeners/ping/ping")
const pointer = require("./listeners/ping/pointer")

const createLight = require("./listeners/lights/createLight")
const getLight = require("./listeners/lights/getLight")
const modifyLight = require("./listeners/lights/modifyLight")
const removeLight = require("./listeners/lights/removeLight")
const modifyLighting = require("./listeners/lights/modifyLighting")

const getToken = require("./listeners/tokens/getToken")
const createToken = require("./listeners/tokens/createToken")
const moveToken = require("./listeners/tokens/moveToken")
const modifyToken = require("./listeners/tokens/modifyToken")
const removeToken = require("./listeners/tokens/removeToken")
const rotateToken = require("./listeners/tokens/rotateToken")
const updateConditions = require("./listeners/tokens/updateConditions")
const updateVisibility = require("./listeners/tokens/updateVisiblity")
const lockToken = require("./listeners/tokens/lockToken")
const updateHealth = require("./listeners/tokens/updateHealth")
const updateElevation = require("./listeners/tokens/updateElevation")

const createInitiative = require("./listeners/initiatives/createInitiative")
const modifyInitiative = require("./listeners/initiatives/modifyInitiative")
const removeInitiative = require("./listeners/initiatives/removeInitiative")
const getInitiatives = require("./listeners/initiatives/getInitiatives")

const createNote = require("./listeners/notes/createNote")
const getNote = require("./listeners/notes/getNote")
const modifyNote = require("./listeners/notes/modifyNote")
const removeNote = require("./listeners/notes/removeNote")

// Get environment variables
require("dotenv").config()

// Server configuration (use .env file)
const port = process.env.PORT

// Create the HTTP server
const httpServer = createServer()
const io = socketIo(httpServer, {
    pingInterval: 10000,
    pingTimeout: 120000,
    maxHttpBufferSize: 1e8
})

// Socket server connection handling
io.use((socket, next) => {
    if (socket.handshake.query.token === "UNITY") next()
    else next(new Error("Authentication error"))
})

io.on("connection", (socket) => {
    // Stateful data
    let accountInfo = {
        uid: ObjectId | null,
        username: String | null
    }
    let sessionInfo = {
        id: ObjectId | null,
        master: ObjectId | null,
        isMaster: Boolean | null,
        synced: Boolean | null,
        scene: ObjectId | null,
        users: Array | null,
        background: ObjectId | null
    }

    // Listener handling
    socket.on("disconnect", () => disconnectListener(accountInfo, sessionInfo, io))
    socket.on("download-image", (imageId, callback) => downloadImage(accountInfo, imageId, callback))
    socket.on("get-user", (uid, callback) => getUser(accountInfo, uid, callback))
    socket.on("get-users", (callback) => getUsers(accountInfo, sessionInfo.id, callback))

    socket.on("register", (email, name, password, callback) => register(accountInfo, email, name, password, callback))
    socket.on("sign-in", (uid, email, password, callback) => signIn(accountInfo, ObjectId.isValid(uid) ? ObjectId(uid) : undefined, email, password, callback))
    socket.on("sign-out", (callback) => signOut(accountInfo, callback))

    socket.on("validate-licence", (licence, callback) => validateLicense(accountInfo, licence, callback))
    socket.on("load-licences", (callback) => loadLicences(accountInfo, callback))
    socket.on("remove-licences", (callback) => removeLicences(accountInfo, callback))

    socket.on("create-session", (name, buffer, callback) => createSession(accountInfo, name, buffer, callback))
    socket.on("join-session", (sessionId, callback) => joinSession(accountInfo, sessionInfo, socket, sessionId, callback))
    socket.on("leave-session", (callback) => leaveSession(accountInfo, sessionInfo, socket, io, callback))
    socket.on("set-state", (scene, synced, callback) => setState(accountInfo, sessionInfo.id, scene, synced, io, callback))
    socket.on("set-scene", (scene, callback) => {
        sessionInfo.scene = ObjectId(scene)
        callback(true)
    })
    socket.on("change-landing-page", (buffer, callback) => changeImage(accountInfo, sessionInfo.id, buffer, io, callback))

    socket.on("create-wall", (data, callback) => createWall(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))
    socket.on("modify-wall", (data, callback) => modifyWall(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))
    socket.on("remove-wall", (id, callback) => removeWall(accountInfo, sessionInfo.id, sessionInfo.scene, id, io, callback))
    socket.on("modify-grid", (data, callback) => modifyGrid(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))

    socket.on("get-scene", (sceneId, callback) => getScene.single(accountInfo, ObjectId(sceneId), callback))
    socket.on("get-scenes", (callback) => getScene.all(accountInfo, sessionInfo.id, callback))
    socket.on("create-scene", (path, data, buffer, callback) => createScene.scene(accountInfo, sessionInfo.id, path, JSON.parse(data), buffer, callback))
    socket.on("create-scene-folder", (path, name, callback) => createScene.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("rename-scene", (sceneId, name, callback) => renameScene.scene(accountInfo, ObjectId(sceneId), name, callback))
    socket.on("rename-scene-folder", (path, name, callback) => renameScene.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("remove-scene", (path, sceneId, callback) => removeScene.scene(accountInfo, sessionInfo.id, path, ObjectId(sceneId), callback))
    socket.on("remove-scene-folder", (path, callback) => removeScene.folder(accountInfo, sessionInfo.id, path, callback))
    socket.on("move-scene", (sceneId, oldPath, newPath, callback) => moveScene.scene(accountInfo, sessionInfo.id, ObjectId(sceneId), oldPath, newPath, callback))
    socket.on("move-scene-folder", (oldPath, newPath, callback) => moveScene.folder(accountInfo, sessionInfo.id, oldPath, newPath, callback))

    socket.on("get-blueprint", (blueprintId, callback) => getBlueprint.single(accountInfo, ObjectId(blueprintId), callback))
    socket.on("get-blueprints", (callback) => getBlueprint.all(accountInfo, sessionInfo.id, callback))
    socket.on("create-blueprint", (path, tokenData, lightingData, buffer, callback) => createBlueprint.blueprint(accountInfo, sessionInfo.id, path, JSON.parse(tokenData), JSON.parse(lightingData), buffer, callback))
    socket.on("modify-blueprint", (id, tokenData, lightingData, buffer, callback) => modifyBlueprint(accountInfo, sessionInfo.id, ObjectId(id), JSON.parse(tokenData), JSON.parse(lightingData), buffer, callback))
    socket.on("create-blueprint-folder", (path, name, callback) => createBlueprint.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("rename-blueprint-folder", (path, name, callback) => renameBlueprintFolder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("remove-blueprint", (path, blueprintId, callback) => removeBlueprint.blueprint(accountInfo, sessionInfo.id, path, ObjectId(blueprintId), callback))
    socket.on("remove-blueprint-folder", (path, callback) => removeBlueprint.folder(accountInfo, sessionInfo.id, path, callback))
    socket.on("move-blueprint", (blueprintId, oldPath, newPath, callback) => moveBlueprint.blueprint(accountInfo, sessionInfo.id, ObjectId(blueprintId), oldPath, newPath, callback))
    socket.on("move-blueprint-folder", (oldPath, newPath, callback) => moveBlueprint.folder(accountInfo, sessionInfo.id, oldPath, newPath, callback))

    socket.on("ping", (location, strong) => ping(accountInfo, sessionInfo.id, location, strong, io))
    socket.on("start-pointer", (location) => pointer.start(accountInfo, sessionInfo.id, location, io))
    socket.on("update-pointer", (location) => pointer.update(accountInfo, sessionInfo.id, location, io))
    socket.on("stop-pointer", () => pointer.stop(accountInfo, sessionInfo.id, io))

    socket.on("get-light", (id, callback) => getLight(accountInfo, ObjectId(id), callback))
    socket.on("create-light", (data, info, callback) => createLight.light(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), JSON.parse(info), io, callback))
    socket.on("modify-light", (id, info, data, callback) => modifyLight.light(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), JSON.parse(info), JSON.parse(data), io, callback))
    socket.on("move-light", (id, data, callback) => modifyLight.move(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), JSON.parse(data), io, callback))
    socket.on("toggle-light", (id, enabled, callback) => modifyLight.toggle(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), enabled, io, callback))
    socket.on("remove-light", (id, callback) => removeLight.light(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), io, callback))
    socket.on("modify-lighting", (data, callback) => modifyLighting(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))

    socket.on("create-preset", (data, callback) => createLight.preset(accountInfo, sessionInfo.id, JSON.parse(data), io, callback))
    socket.on("modify-preset", (id, data, callback) => modifyLight.preset(accountInfo, sessionInfo.id, ObjectId(id), JSON.parse(data), io, callback))
    socket.on("remove-preset", (id, callback) => removeLight.preset(accountInfo, sessionInfo.id, ObjectId(id), io, callback))

    socket.on("get-initiatives", (callback) => getInitiatives(accountInfo, sessionInfo.scene, callback))
    socket.on("create-initiative", (data, callback) => createInitiative(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))
    socket.on("modify-initiative", (id, data, callback) => modifyInitiative(accountInfo, sessionInfo.id, sessionInfo.scene, id, JSON.parse(data), io, callback))
    socket.on("remove-initiative", (id, callback) => removeInitiative(accountInfo, sessionInfo.id, sessionInfo.scene, id, io, callback))
    socket.on("sort-initiative", (callback) => {
        io.to(sessionInfo.id.toString()).emit("sort-initiative")
        callback(true)
    })

    socket.on("get-note", (id, callback) => getNote(accountInfo, id, callback))
    socket.on("create-note", (data, info, callback) => createNote(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), JSON.parse(info), io, callback))
    socket.on("move-note", (id, data, callback) => modifyNote.move(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), JSON.parse(data), io, callback))
    socket.on("modify-note-text", (id, text, callback) => modifyNote.modifyText(accountInfo, sessionInfo.id, ObjectId(id), text, io, callback))
    socket.on("modify-note-header", (id, header, callback) => modifyNote.modifyHeader(accountInfo, sessionInfo.id, ObjectId(id), header, io, callback))
    socket.on("modify-note-image", (id, buffer, callback) => modifyNote.modifyImage(accountInfo, sessionInfo.id, ObjectId(id), buffer, io, callback))
    socket.on("set-note-global", (id, isGlobal, callback) => modifyNote.setGlobal(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), isGlobal, io, callback))
    socket.on("remove-note", (id, callback) => removeNote(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), io, callback))
    socket.on("show-note", (id, callback) => {
        io.to(sessionInfo.id.toString()).emit("show-note", id)
        callback(true)
    })

    socket.on("get-token", (id, callback) => getToken.single(accountInfo, ObjectId(id), callback))
    socket.on("get-tokens", (callback) => getToken.all(accountInfo, sessionInfo.scene, callback))
    socket.on("create-token", (tokenData, lightingData, callback) => createToken(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(tokenData), JSON.parse(lightingData), io, callback))
    socket.on("move-token", (data, callback) => moveToken(accountInfo, sessionInfo.id, JSON.parse(data), io, callback))
    socket.on("modify-token", (id, tokenData, lightingData, buffer, callback) => modifyToken(accountInfo, sessionInfo.id, ObjectId(id), JSON.parse(tokenData), JSON.parse(lightingData), buffer, io, callback))
    socket.on("remove-token", (id, callback) => removeToken(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), io, callback))
    socket.on("update-conditions", (id, conditions, callback) => updateConditions(accountInfo, sessionInfo.id, ObjectId(id), conditions, io, callback))
    socket.on("update-visibility", (id, toggle, callback) => updateVisibility(accountInfo, sessionInfo.id, ObjectId(id), toggle, io, callback))
    socket.on("lock-token", (id, toggle, callback) => lockToken(accountInfo, sessionInfo.id, ObjectId(id), toggle, io, callback))
    socket.on("rotate-token", (id, angle, callback) => rotateToken(accountInfo, sessionInfo.id, ObjectId(id), angle, io, callback))
    socket.on("update-health", (id, value, callback) => updateHealth(accountInfo, sessionInfo.id, ObjectId(id), value, io, callback))
    socket.on("update-elevation", (id, value, callback) => updateElevation(accountInfo, sessionInfo.id, ObjectId(id), value, io, callback))
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
