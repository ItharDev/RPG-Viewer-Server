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
const changeName = require("./listeners/account/changeName")

const validateLicense = require("./listeners/licence/validateLicence")
const loadLicences = require("./listeners/licence/loadLicences")
const removeLicences = require("./listeners/licence/removeLicences")

const createSession = require("./listeners/session/createSession")
const joinSession = require("./listeners/session/joinSession")
const leaveSession = require("./listeners/session/leaveSession")
const setState = require("./listeners/session/setState")
const changeLandingPage = require("./listeners/session/changeImage")

const createWall = require("./listeners/walls/createWall")
const modifyWall = require("./listeners/walls/modifyWall")
const removeWall = require("./listeners/walls/removeWall")

const createPortal = require("./listeners/portals/createPortal")
const modifyPortal = require("./listeners/portals/modifyPortal")
const linkPortal = require("./listeners/portals/linkPortal")
const activatePortal = require("./listeners/portals/activatePortal")
const removePortal = require("./listeners/portals/removePortal")
const movePortal = require("./listeners/portals/movePortal")
const enterPortal = require("./listeners/portals/enterPortal")

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

const createJournal = require("./listeners/journals/createJournal")
const modifyJournal = require("./listeners/journals/modifyJournal")
const getJournal = require("./listeners/journals/getJournal")
const moveJournal = require("./listeners/journals/moveJournal")
const removeJournal = require("./listeners/journals/removeJournal")
const saveJournal = require("./listeners/journals/saveJournal")
const renameJournalFolder = require("./listeners/journals/renameJournalFolder")

const ping = require("./listeners/ping/ping")
const pointer = require("./listeners/ping/pointer")

const createLight = require("./listeners/lights/createLight")
const pasteLight = require("./listeners/lights/pasteLight")
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
const rotateTokenLight = require("./listeners/tokens/rotateTokenLight")
const updateConditions = require("./listeners/tokens/updateConditions")
const updateVisibility = require("./listeners/tokens/updateVisiblity")
const lockToken = require("./listeners/tokens/lockToken")
const groupToken = require("./listeners/tokens/groupTokens")
const clearGroup = require("./listeners/tokens/clearGroup")
const toggleGroup = require("./listeners/tokens/toggleGroup")
const updateHealth = require("./listeners/tokens/updateHealth")
const updateElevation = require("./listeners/tokens/updateElevation")

const createInitiative = require("./listeners/initiatives/createInitiative")
const modifyInitiative = require("./listeners/initiatives/modifyInitiative")
const removeInitiative = require("./listeners/initiatives/removeInitiative")
const resetInitiative = require("./listeners/initiatives/resetInitiatives")
const getInitiatives = require("./listeners/initiatives/getInitiatives")

const createNote = require("./listeners/notes/createNote")
const getNote = require("./listeners/notes/getNote")
const modifyNote = require("./listeners/notes/modifyNote")
const removeNote = require("./listeners/notes/removeNote")
const saveNote = require("./listeners/notes/saveNote")
const toggleTokenLight = require("./listeners/tokens/toggleTokenLight")

const changeImage = require("./listeners/scenes/changeImage")

// Get environment variables
require("dotenv").config()

// Server configuration (use .env file)
const port = process.env.PORT
const interval = process.env.PING_INTERVAL
const timeout = process.env.PING_TIMEOUT
const maxBuffer = process.env.MAX_BUFFER

const httpServer = createServer()
const io = socketIo(httpServer, {
    maxHttpBufferSize: maxBuffer
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

    socket.on("register", (email, name, password, callback) => register(email, name, password, callback))
    socket.on("sign-in", (uid, email, password, callback) => signIn(accountInfo, ObjectId.isValid(uid) ? ObjectId(uid) : undefined, email, password, callback))
    socket.on("sign-out", (callback) => signOut(accountInfo, callback))
    socket.on("change-name", (name, callback) => changeName(accountInfo, name, callback))

    socket.on("validate-licence", (licence, callback) => validateLicense(accountInfo, licence, callback))
    socket.on("load-licences", (callback) => loadLicences(accountInfo, callback))
    socket.on("remove-licences", (callback) => removeLicences(accountInfo, callback))

    socket.on("create-session", (name, buffer, callback) => createSession(accountInfo, name, buffer, callback))
    socket.on("join-session", (sessionId, callback) => joinSession(accountInfo, sessionInfo, socket, sessionId, callback))
    socket.on("leave-session", (callback) => leaveSession(accountInfo, sessionInfo, socket, io, callback))
    socket.on("set-state", (scene, synced, callback) => setState(accountInfo, sessionInfo.id, scene, synced, io, callback))
    socket.on("set-scene", (scene, callback) => {
        if (scene) sessionInfo.scene = ObjectId(scene)
        callback(true)
    })
    socket.on("change-landing-page", (buffer, callback) => changeLandingPage(accountInfo, sessionInfo.id, buffer, io, callback))

    socket.on("create-wall", (data, callback) => createWall(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))
    socket.on("modify-wall", (data, callback) => modifyWall(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))
    socket.on("remove-wall", (id, callback) => removeWall(accountInfo, sessionInfo.id, sessionInfo.scene, id, io, callback))
    socket.on("modify-grid", (data, callback) => modifyGrid(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), io, callback))

    socket.on("create-portal", (position, radius, callback) => createPortal(accountInfo, sessionInfo.id, sessionInfo.scene, position, radius, io, callback))
    socket.on("modify-portal", (id, data, callback) => modifyPortal(accountInfo, sessionInfo.id, sessionInfo.scene, id, data, io, callback))
    socket.on("link-portal", (id, link, callback) => linkPortal(accountInfo, sessionInfo.id, sessionInfo.scene, id, link, io, callback))
    socket.on("activate-portal", (id, active, callback) => activatePortal(accountInfo, sessionInfo.id, sessionInfo.scene, id, active, io, callback))
    socket.on("remove-portal", (id, callback) => removePortal(accountInfo, sessionInfo.id, sessionInfo.scene, id, io, callback))
    socket.on("move-portal", (id, position, callback) => movePortal(accountInfo, sessionInfo.id, sessionInfo.scene, id, position, io, callback))
    socket.on("enter-portal", (tokenId, portalId, callback) => enterPortal(accountInfo, sessionInfo.id, sessionInfo.scene, tokenId, portalId, io, callback))
    
    socket.on("get-scene", (sceneId, callback) => getScene.single(accountInfo, ObjectId(sceneId), callback))
    socket.on("get-scenes", (callback) => getScene.all(accountInfo, sessionInfo.id, callback))
    socket.on("create-scene", (path, data, buffer, callback) => createScene.scene(accountInfo, sessionInfo.id, path, JSON.parse(data), buffer, callback))
    socket.on("create-scene-folder", (path, name, callback) => createScene.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("rename-scene", (sceneId, name, callback) => renameScene.scene(accountInfo, ObjectId(sceneId), name, callback))
    socket.on("rename-scene-folder", (path, name, callback) => renameScene.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("remove-scene", (path, sceneId, callback) => removeScene.scene(accountInfo, sessionInfo.id, path, ObjectId(sceneId), io, callback))
    socket.on("remove-scene-folder", (path, callback) => removeScene.folder(accountInfo, sessionInfo.id, path, io, callback))
    socket.on("move-scene", (sceneId, oldPath, newPath, callback) => moveScene.scene(accountInfo, sessionInfo.id, ObjectId(sceneId), oldPath, newPath, callback))
    socket.on("move-scene-folder", (oldPath, newPath, callback) => moveScene.folder(accountInfo, sessionInfo.id, oldPath, newPath, callback))

    socket.on("get-blueprint", (blueprintId, callback) => getBlueprint.single(accountInfo, ObjectId(blueprintId), callback))
    socket.on("get-blueprints", (callback) => getBlueprint.all(accountInfo, sessionInfo.id, callback))
    socket.on("get-public-blueprints", (callback) => getBlueprint.public(accountInfo, sessionInfo.id, callback))
    socket.on("create-blueprint", (path, tokenData, lightingData, imageBuffer, artBuffer, callback) => createBlueprint.blueprint(accountInfo, sessionInfo.id, path, JSON.parse(tokenData), JSON.parse(lightingData), imageBuffer, artBuffer, io, callback))
    socket.on("modify-blueprint", (id, tokenData, lightingData, imageBuffer, artBuffer, callback) => modifyBlueprint(accountInfo, sessionInfo.id, ObjectId(id), JSON.parse(tokenData), JSON.parse(lightingData), imageBuffer, artBuffer, io, callback))
    socket.on("create-blueprint-folder", (path, name, callback) => createBlueprint.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("rename-blueprint-folder", (path, name, callback) => renameBlueprintFolder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("remove-blueprint", (path, blueprintId, callback) => removeBlueprint.blueprint(accountInfo, sessionInfo.id, path, ObjectId(blueprintId), io, callback))
    socket.on("remove-blueprint-folder", (path, callback) => removeBlueprint.folder(accountInfo, sessionInfo.id, path, callback))
    socket.on("move-blueprint", (blueprintId, oldPath, newPath, callback) => moveBlueprint.blueprint(accountInfo, sessionInfo.id, ObjectId(blueprintId), oldPath, newPath, callback))
    socket.on("move-blueprint-folder", (oldPath, newPath, callback) => moveBlueprint.folder(accountInfo, sessionInfo.id, oldPath, newPath, callback))

    socket.on("get-journal", (journalId, callback) => getJournal.single(accountInfo, ObjectId(journalId), callback))
    socket.on("get-journals", (callback) => getJournal.all(accountInfo, sessionInfo.id, callback))
    socket.on("create-journal", (path, data, callback) => createJournal.journal(accountInfo, sessionInfo.id, path, JSON.parse(data), callback))
    socket.on("share-journal", (id, data, callback) => modifyJournal.share(accountInfo, sessionInfo.id, id, JSON.parse(data), io, callback))
    socket.on("modify-journal-text", (id, text, callback) => modifyJournal.modifyText(accountInfo, sessionInfo.id, ObjectId(id), text, io, callback))
    socket.on("modify-journal-header", (id, header, callback) => modifyJournal.modifyHeader(accountInfo, sessionInfo.id, ObjectId(id), header, io, callback))
    socket.on("modify-journal-image", (id, buffer, callback) => modifyJournal.modifyImage(accountInfo, sessionInfo.id, ObjectId(id), buffer, io, callback))
    socket.on("create-journal-folder", (path, name, callback) => createJournal.folder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("rename-journal-folder", (path, name, callback) => renameJournalFolder(accountInfo, sessionInfo.id, path, name, callback))
    socket.on("remove-journal", (path, blueprintId, callback) => removeJournal.journal(accountInfo, sessionInfo.id, path, ObjectId(blueprintId), callback))
    socket.on("remove-journal-folder", (path, callback) => removeJournal.folder(accountInfo, sessionInfo.id, path, callback))
    socket.on("move-journal", (blueprintId, oldPath, newPath, callback) => moveJournal.journal(accountInfo, sessionInfo.id, ObjectId(blueprintId), oldPath, newPath, callback))
    socket.on("move-journal-folder", (oldPath, newPath, callback) => moveJournal.folder(accountInfo, sessionInfo.id, oldPath, newPath, callback))
    socket.on("save-journal", (id, callback) => saveJournal(accountInfo, sessionInfo.id, id, callback))
    socket.on("show-journal", (id, callback) => {
        io.to(sessionInfo.id.toString()).emit("show-journal", id)
        callback(true)
    })

    socket.on("ping", (location, strong) => ping(accountInfo, sessionInfo.id, location, strong, io))
    socket.on("start-pointer", (location) => pointer.start(accountInfo, sessionInfo.id, location, io))
    socket.on("update-pointer", (location) => pointer.update(accountInfo, sessionInfo.id, location, io))
    socket.on("stop-pointer", () => pointer.stop(accountInfo, sessionInfo.id, io))

    socket.on("get-light", (id, callback) => getLight(accountInfo, ObjectId(id), callback))
    socket.on("create-light", (data, info, callback) => createLight.light(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(data), JSON.parse(info), io, callback))
    socket.on("paste-light", (info, usePreset, callback) => pasteLight(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(info), usePreset, io, callback))
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
    socket.on("reset-initiatives", (callback) => resetInitiative(accountInfo, sessionInfo.id, sessionInfo.scene, io, callback))
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
    socket.on("save-note", (id, callback) => saveNote(accountInfo, sessionInfo.id, id, callback))
    socket.on("show-note", (id, callback) => {
        io.to(sessionInfo.id.toString()).emit("show-note", id)
        callback(true)
    })

    socket.on("get-token", (id, callback) => getToken.single(accountInfo, ObjectId(id), callback))
    socket.on("get-tokens", (callback) => getToken.all(accountInfo, sessionInfo.scene, callback))
    socket.on("create-token", (tokenData, lightingData, isPublic, callback) => createToken(accountInfo, sessionInfo.id, sessionInfo.scene, JSON.parse(tokenData), JSON.parse(lightingData), isPublic, io, callback))
    socket.on("move-token", (data, callback) => moveToken(accountInfo, sessionInfo.id, JSON.parse(data), io, callback))
    socket.on("modify-token", (id, tokenData, lightingData, imageBuffer, artBuffer, callback) => modifyToken(accountInfo, sessionInfo.id, ObjectId(id), JSON.parse(tokenData), JSON.parse(lightingData), imageBuffer, artBuffer, io, callback))
    socket.on("remove-token", (id, callback) => removeToken(accountInfo, sessionInfo.id, sessionInfo.scene, ObjectId(id), io, callback))
    socket.on("update-conditions", (id, conditions, callback) => updateConditions(accountInfo, sessionInfo.id, ObjectId(id), conditions, io, callback))
    socket.on("update-visibility", (id, toggle, callback) => updateVisibility(accountInfo, sessionInfo.id, ObjectId(id), toggle, io, callback))
    socket.on("lock-token", (id, toggle, callback) => lockToken(accountInfo, sessionInfo.id, ObjectId(id), toggle, io, callback))
    socket.on("group-tokens", (tokens, group, callback) => groupToken(accountInfo, sessionInfo.scene, tokens.map(e => ObjectId(e)), group, callback))
    socket.on("clear-group", (group, callback) => clearGroup(accountInfo, sessionInfo.scene, group, callback))
    socket.on("toggle-group", (group, state, callback) => toggleGroup(accountInfo, sessionInfo.scene, group, state, callback))
    socket.on("toggle-token-light", (id, toggle, callback) => toggleTokenLight(accountInfo, sessionInfo.id, ObjectId(id), toggle, io, callback))
    socket.on("rotate-token", (id, angle, user, callback) => rotateToken(accountInfo, sessionInfo.id, ObjectId(id), angle, user, io, callback))
    socket.on("rotate-token-light", (id, angle, user, callback) => rotateTokenLight(accountInfo, sessionInfo.id, ObjectId(id), angle, user, io, callback))
    socket.on("update-health", (id, value, callback) => updateHealth(accountInfo, sessionInfo.id, ObjectId(id), value, io, callback))
    socket.on("update-elevation", (id, value, callback) => updateElevation(accountInfo, sessionInfo.id, ObjectId(id), value, io, callback))
    socket.on("show-image", (id, uid, callback) => {
        io.to(sessionInfo.id.toString()).emit("show-image", id, uid)
        callback(true)
    })

    socket.on("change-scene-image", (buffer, callback) => changeImage(accountInfo, sessionInfo.id, sessionInfo.scene, buffer, io, callback))

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
