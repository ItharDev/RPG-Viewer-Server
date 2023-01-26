//#region Dependencies
const { createServer } = require('http')
const { ObjectId } = require('mongodb')
const socket = require('socket.io')

const networking = require('./modules/networking')
const { blueprintModel, sceneModel, sessionModel, userModel, tokenModel, noteModel } = require('./schemas')
const account = require('./modules/account')
const scene = require('./modules/scene')
const blueprint = require('./modules/blueprint')
const session = require('./modules/session')
const token = require('./modules/token')
const notes = require('./modules/notes')

const server = createServer()
const port = 3000
const io = socket(server, {
    pingInterval: 10000,
    pingTimeout: 30000,
    maxHttpBufferSize: 1e8

})
io.use((socket, next) => {
    if (socket.handshake.query.token === 'UNITY') next()
    else next(new Error('Authentication error'));
})

async function startDatabaseAndServer() {
    networking.startDatabase()
    server.listen(port, () => {
    })
}
//#endregion

io.on('connection', (socket) => {
    //#region Data
    let accountInfo = {
        uid: ObjectId,
        username: String
    }
    let sessionInfo = {
        id: undefined,
        master: undefined,
        synced: undefined,
        scene: undefined
    }
    //#endregion

    //#region Misc
    socket.on('disconnect', async () => {
        try {
            if (!sessionInfo) return;
            if (sessionInfo.id && sessionInfo.master) {
                await session.sync(sessionInfo.id, false)
                await session.set(sessionInfo.id, undefined)
            }

            sessionInfo = undefined
        } catch (e) {
            console.error(e.message)
        }
    })
    socket.on('download-image', async (imageId, callback) => {
        try {
            await networking.downloadFile(ObjectId(imageId)).then((buffer) => {
                callback(true, buffer)
            }, (rejected) => {
                callback(false, rejected)
            })
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Accounts
    socket.on('get-user', async (uid, callback) => {
        try {
            const acc = await account.get(ObjectId(uid))
            callback(true, acc)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('register', async (email, name, password, callback) => {
        try {
            await account.register(new userModel({
                email: email,
                name: name,
                password: password,
                online: false,
                licences: []
            }))

            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('sign-in', async (email, password, uid, callback) => {
        try {
            const user = await account.signIn(email, password, uid)
            accountInfo = {
                uid: user._id,
                username: user.name
            }
            callback(true, user.name, user._id.toString())
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('sign-out', async (callback) => {
        try {
            accountInfo = undefined
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('validate-licence', async (licenceKey, callback) => {
        try {
            const name = await account.validateLicence(ObjectId(licenceKey), accountInfo.uid)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('load-licences', async (callback) => {
        try {
            const licences = await account.loadLicences(accountInfo.uid)
            callback(true, licences)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-licences', async (callback) => {
        try {
            await account.removeLicences(accountInfo.uid)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(e.message)
        }
    })
    //#endregion

    //#region Sessions
    socket.on('create-session', async (name, buffer, callback) => {
        try {
            await session.create(accountInfo.uid, new sessionModel({
                name: name,
                master: accountInfo.uid,
                users: [],
                state: {
                    synced: false
                },
                blueprints: [],
                scenes: [],
                background: new ObjectId()
            }), buffer)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(e.message)
        }
    })
    socket.on('join-session', async (sessionId, callback) => {
        try {
            const data = await session.join(ObjectId(sessionId), socket, accountInfo.username)
            sessionInfo = {
                id: data._id,
                master: data.master.equals(accountInfo.uid),
                synced: data.state.synced,
                scene: data.state.scene,
                users: data.users,
                background: data.background
            }
            callback(true, sessionInfo)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('leave-session', async (callback) => {
        try {
            await session.leave(socket, sessionInfo.id, accountInfo.username)
            if (sessionInfo.master) {
                await session.sync(sessionInfo.id, false)
                await session.set(sessionInfo.id, undefined)
            }

            sessionInfo = undefined
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Tokens
    socket.on('get-token', async (id, callback) => {
        try {
            const data = await token.get(ObjectId(id))
            callback(true, data, data._id.toString())
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('get-tokens', async (id, callback) => {
        try {
            const data = await token.getAll(ObjectId(id))
            callback(true, data)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('create-token', async (json, callback) => {
        try {
            if (!sessionInfo.master) throw new Error('Operation not allowed')
            const data = JSON.parse(json)
            const tokenId = await token.create(sessionInfo.scene, new tokenModel({
                name: data.name,
                type: data.type,
                permissions: data.permissions,
                dimensions: data.dimensions,
                hasVision: data.hasVision,
                nightVision: data.nightVision,
                highlighted: data.highlighted,
                lightRadius: data.lightRadius,
                lightEffect: data.lightEffect,
                lightColor: data.lightColor,
                lightIntensity: data.lightIntensity,
                flickerFrequency: data.flickerFrequency,
                flickerAmount: data.flickerAmount,
                pulseInterval: data.pulseInterval,
                pulseAmount: data.pulseAmount,
                image: ObjectId(data.image),
                position: data.position,
                enabled: data.enabled,
                health: 0,
                elevation: "0 ft",
                conditions: 0,
                locked: false,
                rotation: 0
            }))

            io.to(sessionInfo.id.toString()).emit('create-token', data, tokenId)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('move-token', async (id, json, callback) => {
        try {
            const data = JSON.parse(json)
            await token.move(ObjectId(id), data.points[data.points.length - 1])
            io.to(sessionInfo.id.toString()).emit('move-token', id, json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-token', async (json, image, callback) => {
        try {
            const data = JSON.parse(json)
            const newImage = await token.modify(ObjectId(data.id), new tokenModel({
                _id: ObjectId(data.id),
                name: data.name,
                type: data.type,
                permissions: data.permissions,
                dimensions: data.dimensions,
                hasVision: data.hasVision,
                nightVision: data.nightVision,
                highlighted: data.highlighted,
                lightRadius: data.lightRadius,
                lightEffect: data.lightEffect,
                lightColor: data.lightColor,
                lightIntensity: data.lightIntensity,
                flickerFrequency: data.flickerFrequency,
                flickerAmount: data.flickerAmount,
                pulseInterval: data.pulseInterval,
                pulseAmount: data.pulseAmount,
                image: ObjectId(data.image),
                position: data.position,
                enabled: data.enabled,
                health: data.health,
                elevation: data.elevation,
                conditions: data.conditions,
                locked: data.locked,
                rotation: data.rotation
            }), image)

            data.image = newImage
            io.to(sessionInfo.id.toString()).emit('modify-token', data.id, data)
            callback(true, newImage)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-token', async (id, callback) => {
        try {
            await token.remove(sessionInfo.scene, ObjectId(id))
            io.to(sessionInfo.id.toString()).emit('remove-token', id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('update-visibility', async (id, state, callback) => {
        try {
            await token.setVisibility(ObjectId(id), state)
            io.to(sessionInfo.id.toString()).emit('update-visibility', id, state)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('update-elevation', async (id, elevation, callback) => {
        try {
            await token.setElevation(ObjectId(id), elevation)
            io.to(sessionInfo.id.toString()).emit('update-elevation', id, elevation)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('update-conditions', async (id, conditions, callback) => {
        try {
            await token.setConditions(ObjectId(id), conditions)
            io.to(sessionInfo.id.toString()).emit('update-conditions', id, conditions)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('rotate-token', async (id, angle, callback) => {
        try {
            await token.setRotation(ObjectId(id), angle)
            io.to(sessionInfo.id.toString()).emit('rotate-token', id, angle)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('lock-token', async (id, state, callback) => {
        try {
            await token.lock(ObjectId(id), state)
            io.to(sessionInfo.id.toString()).emit('lock-token', id, state)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('update-health', async (id, health, callback) => {
        try {
            await token.setHealth(ObjectId(id), health)
            io.to(sessionInfo.id.toString()).emit('update-health', id, health)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region State
    socket.on('set-scene', async (sceneId, callback) => {
        try {
            const scene = await session.set(sessionInfo.id, sceneId ? ObjectId(sceneId) : undefined)
            io.to(sessionInfo.id.toString()).emit('set-scene', sceneId)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('update-scene', (id) => {
        if (id) sessionInfo.scene = ObjectId(id)
    })
    socket.on('change-state', async (callback) => {
        try {
            await session.sync(sessionInfo.id, !sessionInfo.synced)
            sessionInfo.synced = !sessionInfo.synced
            io.to(sessionInfo.id.toString()).emit('change-state', sessionInfo.synced, sessionInfo.scene)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Doors
    socket.on('toggle-door', async (id, state, callback) => {
        try {
            await scene.toggleDoor(sessionInfo.scene, ObjectId(id), state)
            io.to(sessionInfo.id.toString()).emit('toggle-door', id, state)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-door', async (json, callback) => {
        try {
            await scene.modifyDoor(sessionInfo.scene, JSON.parse(json))
            io.to(sessionInfo.id.toString()).emit('modify-door', json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Lights
    socket.on('create-light', async (json, callback) => {
        try {
            const data = await scene.createLight(sessionInfo.scene, JSON.parse(json))
            io.to(sessionInfo.id.toString()).emit('create-light', data)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-light', async (json, callback) => {
        try {
            const data = await scene.modifyLight(sessionInfo.scene, JSON.parse(json))
            io.to(sessionInfo.id.toString()).emit('modify-light', data)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-light', async (id, callback) => {
        try {
            await scene.removeLight(sessionInfo.scene, ObjectId(id))
            io.to(sessionInfo.id.toString()).emit('remove-light', id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Tools
    socket.on('ping', (position, strong) => {
        io.to(sessionInfo.id.toString()).emit('ping', position, strong)
    })

    socket.on('modify-initiatives', async (json, callback) => {
        try {
            if (!json) {
                await scene.setInitiatives(sessionInfo.scene, null)
            } else {
                let list = []
                for (let i = 0; i < json.length; i++) {
                    const element = json[i];
                    list.push(JSON.parse(element))
                }
                await scene.setInitiatives(sessionInfo.scene, list)
            }
            io.to(sessionInfo.id.toString()).emit('modify-initiatives', json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Scenes
    socket.on('get-scene', async (id, callback) => {
        try {
            const data = await scene.get(ObjectId(id))
            callback(true, data, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('get-scenes', async (callback) => {
        try {
            const result = await scene.loadDirectory(sessionInfo.id)
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('upload-scene', async (path, json, image, callback) => {
        try {
            const data = JSON.parse(json)

            const upload = await scene.create(sessionInfo.id, path, new sceneModel({
                data: {
                    image: new ObjectId(),
                    name: data.data.name,
                    nightStrength: data.data.nightStrength
                },
                fogOfWar: data.fogOfWar,
                grid: data.grid,
                walls: data.walls,
                tokens: data.tokens,
                initiative: data.initiative
            }), image)
            callback(true, scene)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-scene', async (id, path, callback) => {
        try {
            const requireUpdate = await scene.remove(sessionInfo.id, path, ObjectId(id))
            if (requireUpdate) io.to(sessionInfo.id.toString()).emit('change-state', false, "")
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-scene', async (id, json, callback) => {
        try {
            const data = JSON.parse(json)

            await scene.modify(sessionInfo.id, ObjectId(id), new sceneModel({
                data: data.data,
                fogOfWar: data.fogOfWar,
                grid: data.grid,
                walls: data.walls,
                tokens: data.tokens,
                initiative: data.initiative
            }))
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('move-scene', async (id, oldPath, newPath, callback) => {
        try {
            await scene.move(sessionInfo.id, ObjectId(id), oldPath, newPath)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('create-scene-folder', async (path, name, callback) => {
        try {
            const id = await scene.createFolder(sessionInfo.id, path, name)
            callback(true, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-scene-folder', async (path, callback) => {
        try {
            const requireUpdate = await scene.removeFolder(sessionInfo.id, path)
            if (requireUpdate) io.to(sessionInfo.id.toString()).emit('change-state', false)

            callback(true, requireUpdate)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('rename-scene-folder', async (path, name, callback) => {
        try {
            await scene.renameFolder(sessionInfo.id, path, name)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('move-scene-folder', async (oldPath, newPath, callback) => {
        try {
            await scene.moveFolder(sessionInfo.id, oldPath, newPath)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Blueprints
    socket.on('get-blueprint', async (id, callback) => {
        try {
            const bp = await blueprint.get(ObjectId(id))
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('get-blueprints', async (callback) => {
        try {
            const result = await blueprint.loadDirectory(sessionInfo.id)
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('create-blueprint', async (path, json, image, callback) => {
        try {
            const data = JSON.parse(json)
            const result = await blueprint.create(sessionInfo.id, path, new blueprintModel({
                name: data.name,
                type: data.type,
                permissions: data.permissions,
                dimensions: data.dimensions,
                hasVision: data.hasVision,
                nightVision: data.nightVision,
                highlighted: data.highlighted,
                lightRadius: data.lightRadius,
                lightEffect: data.lightEffect,
                lightColor: data.lightColor,
                lightIntensity: data.lightIntensity,
                flickerFrequency: data.flickerFrequency,
                flickerAmount: data.flickerAmount,
                pulseInterval: data.pulseInterval,
                pulseAmount: data.pulseAmount,
                image: new ObjectId()
            }), image)
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-blueprint', async (id, path, callback) => {
        try {
            await blueprint.remove(sessionInfo.id, path, ObjectId(id))
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-blueprint', async (id, json, image, callback) => {
        try {
            const data = JSON.parse(json)
            const bp = await blueprint.modify(ObjectId(id), new blueprintModel(data), image)
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('set-permissions', async (blueprintId, json, callback) => {
        try {
            let list = []
            for (let i = 0; i < json.length; i++) {
                const element = JSON.parse(json[i]);
                list.push({
                    user: ObjectId(element.user),
                    permission: element.permission
                })
            }
            await blueprint.setPermissions(ObjectId(blueprintId), list)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('refresh-permissions', async (blueprintId, callback) => {
        try {
            const bp = await blueprint.refreshPermissions(sessionInfo.id, ObjectId(blueprintId))
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('move-blueprint', async (id, oldPath, newPath, callback) => {
        try {
            await blueprint.move(sessionInfo.id, ObjectId(id), oldPath, newPath)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('create-blueprint-folder', async (path, name, callback) => {
        try {
            const id = await blueprint.createFolder(sessionInfo.id, path, name)
            callback(true, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-blueprint-folder', async (path, callback) => {
        try {
            await blueprint.removeFolder(sessionInfo.id, path)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('rename-blueprint-folder', async (path, name, callback) => {
        try {
            await blueprint.renameFolder(sessionInfo.id, path, name)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('move-blueprint-folder', async (oldPath, newPath, callback) => {
        try {
            await blueprint.moveFolder(sessionInfo.id, oldPath, newPath)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion

    //#region Notes
    socket.on('get-note', async (id, callback) => {
        try {
            const data = await notes.get(ObjectId(id))
            callback(true, data, data._id.toString())
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on('get-notes', async (id, callback) => {
        try {
            const data = await notes.getAll(ObjectId(id))
            callback(true, data)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('create-note', async (json, callback) => {
        try {
            const data = JSON.parse(json)
            data.owner = accountInfo.uid

            const id = await notes.create(sessionInfo.scene, new noteModel({
                owner: data.owner,
                text: data.text,
                image: undefined,
                position: data.position,
                header: data.header,
                isPublic: data.isPublic
            }))

            io.to(sessionInfo.id.toString()).emit('create-note', data, id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-note-text', async (id, text, callback) => {
        try {
            await notes.modifyText(ObjectId(id), text)
            io.to(sessionInfo.id.toString()).emit('modify-note-text', id, text)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-note-header', async (id, text, callback) => {
        try {
            await notes.modifyHeader(ObjectId(id), text)
            io.to(sessionInfo.id.toString()).emit('modify-note-header', id, text)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('modify-note-image', async (id, buffer, callback) => {
        try {
            const newImage = await notes.modifyImage(ObjectId(id), buffer)
            io.to(sessionInfo.id.toString()).emit('modify-note-image', id, newImage)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('remove-note', async (id, callback) => {
        try {
            await notes.remove(sessionInfo.scene, ObjectId(id))
            io.to(sessionInfo.id.toString()).emit('remove-note', id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('move-note', async (id, position, callback) => {
        try {
            await notes.move(ObjectId(id), JSON.parse(position))
            io.to(sessionInfo.id.toString()).emit('move-note', id, position)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on('set-note-state', async (id, isPublic, callback) => {
        try {
            await notes.setPublic(ObjectId(id), isPublic)
            io.to(sessionInfo.id.toString()).emit('set-note-state', id, isPublic)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    //#endregion
})

startDatabaseAndServer()