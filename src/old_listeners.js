io.on("connection", (socket) => {
    // #region Data
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
    // #endregion

    // #region Misc
    //socket.on("disconnect", async () => {
    //    console.log("Received package: disconnect")
    //    try {
    //        if (!sessionInfo) return
    //        if (sessionInfo.id && sessionInfo.master) {
    //            await session.sync(sessionInfo.id, false)
    //            await session.set(sessionInfo.id, undefined)
//
    //            io.to(sessionInfo.id.toString()).emit("change-state", false, "")
    //        }
//
    //        sessionInfo = undefined
    //    } catch (e) {
    //        console.error(e.message)
    //    }
    //})
    //socket.on("download-image", async (imageId, callback) => {
    //    console.log("Received package: download-image")
    //    try {
    //        await networking.downloadFile(ObjectId(imageId)).then((buffer) => {
    //            callback(true, buffer)
    //        }, (rejected) => {
    //            callback(false, rejected)
    //        })
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    // #endregion

    // #region Accounts
    //socket.on("get-user", async (uid, callback) => {
    //    console.log("Received package: get-user")
    //    try {
    //        const acc = await account.get(ObjectId(uid))
    //        callback(true, acc)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    //socket.on("register", async (
    //    email, name, password, callback
    //) => {
    //    console.log("Received package: register")
    //    try {
    //        await account.register(new userModel({
    //            email,
    //            name,
    //            password,
    //            online: false,
    //            licences: []
    //        }))
//
    //        callback(true)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    //socket.on("sign-in", async (
    //    email, password, uid, callback
    //) => {
    //    console.log("Received package: sign-in")
    //    try {
    //        const user = await account.signIn(email, password, uid)
    //        accountInfo = {
    //            uid: user._id,
    //            username: user.name
    //        }
    //        callback(true, user.name, user._id.toString())
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    //socket.on("sign-out", async (callback) => {
    //    console.log("Received package: sign-out")
    //    try {
    //        accountInfo = undefined
    //        callback(true)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})

    //socket.on("validate-licence", async (licenceKey, callback) => {
    //    console.log("Received package: validate-licence")
    //    try {
    //        const name = await account.validateLicence(ObjectId(licenceKey), accountInfo.uid)
    //        callback(true)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})

    //socket.on("load-licences", async (callback) => {
    //    console.log("Received package: load-licences")
    //    try {
    //        const licences = await account.loadLicences(accountInfo.uid)
    //        callback(true, licences)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    //socket.on("remove-licences", async (callback) => {
    //    console.log("Received package: remove-licences")
    //    try {
    //        await account.removeLicences(accountInfo.uid)
    //        callback(true)
    //    } catch (e) {
    //        console.error(e)
    //        callback(e.message)
    //    }
    //})
    //// #endregion

    // #region Sessions
    //socket.on("create-session", async (name, buffer, callback) => {
    //    console.log("Received package: create-session")
    //    try {
    //        await session.create(accountInfo.uid, new sessionModel({
    //            name,
    //            master: accountInfo.uid,
    //            users: [],
    //            state: {
    //                synced: false
    //            },
    //            blueprints: [],
    //            scenes: [],
    //            background: new ObjectId()
    //        }), buffer)
    //        callback(true)
    //    } catch (e) {
    //        console.error(e)
    //        callback(e.message)
    //    }
    //})
    //socket.on("join-session", async (sessionId, callback) => {
    //    console.log("Received package: join-session")
    //    try {
    //        const data = await session.join(ObjectId(sessionId), socket, accountInfo.username)
    //        sessionInfo = {
    //            id: data._id,
    //            master: data.master.equals(accountInfo.uid),
    //            masterId: data.master,
    //            synced: data.state.synced,
    //            scene: data.state.scene,
    //            users: data.users,
    //            background: data.background
    //        }
    //        callback(true, sessionInfo)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    //socket.on("leave-session", async (callback) => {
    //    console.log("Received package: leave-session")
    //    try {
    //        await session.leave(socket, sessionInfo.id, accountInfo.username)
    //        if (sessionInfo.master) {
    //            await session.sync(sessionInfo.id, false)
    //            await session.set(sessionInfo.id, undefined)
    //            io.to(sessionInfo.id.toString()).emit("change-state", false, "")
    //        }
//
    //        sessionInfo = undefined
    //        callback(true)
    //    } catch (e) {
    //        console.error(e)
    //        callback(false, e.message)
    //    }
    //})
    // #endregion

    // #region Tokens
    socket.on("get-token", async (id, callback) => {
        console.log("Received package: get-token")
        try {
            const data = await token.get(ObjectId(id))
            callback(true, data, data._id.toString())
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("get-tokens", async (id, callback) => {
        console.log("Received package: get-tokens")
        try {
            const data = await token.getAll(ObjectId(id))
            callback(true, data)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("create-token", async (json, callback) => {
        console.log("Received package: create-token")
        try {
            if (!sessionInfo.master) throw new Error("Operation not allowed")
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

            io.to(sessionInfo.id.toString()).emit("create-token", data, tokenId)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-token", async (id, json, callback) => {
        console.log("Received package: move-token")
        try {
            const data = JSON.parse(json)
            await token.move(ObjectId(id), data.points[data.points.length - 1])
            io.to(sessionInfo.id.toString()).emit("move-token", id, json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-token", async (json, image, callback) => {
        console.log("Received package: modify-token")
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
            io.to(sessionInfo.id.toString()).emit("modify-token", data.id, data)
            callback(true, newImage)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-token", async (id, callback) => {
        console.log("Received package: remove-token")
        try {
            await token.remove(sessionInfo.scene, ObjectId(id))
            io.to(sessionInfo.id.toString()).emit("remove-token", id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("update-visibility", async (id, state, callback) => {
        console.log("Received package: update-visibility")
        try {
            await token.setVisibility(ObjectId(id), state)
            io.to(sessionInfo.id.toString()).emit("update-visibility", id, state)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("update-elevation", async (id, elevation, callback) => {
        console.log("Received package: update-elevation")
        try {
            await token.setElevation(ObjectId(id), elevation)
            io.to(sessionInfo.id.toString()).emit("update-elevation", id, elevation)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("update-conditions", async (id, conditions, callback) => {
        console.log("Received package: update-conditions")
        try {
            await token.setConditions(ObjectId(id), conditions)
            io.to(sessionInfo.id.toString()).emit("update-conditions", id, conditions)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("rotate-token", async (id, angle, callback) => {
        console.log("Received package: rotate-token")
        try {
            await token.setRotation(ObjectId(id), angle)
            io.to(sessionInfo.id.toString()).emit("rotate-token", id, angle)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("lock-token", async (id, state, callback) => {
        console.log("Received package: lock-token")
        try {
            await token.lock(ObjectId(id), state)
            io.to(sessionInfo.id.toString()).emit("lock-token", id, state)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("update-health", async (id, health, callback) => {
        console.log("Received package: update-health")
        try {
            await token.setHealth(ObjectId(id), health)
            io.to(sessionInfo.id.toString()).emit("update-health", id, health)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region State
    socket.on("set-scene", async (sceneId, callback) => {
        console.log("Received package: set-scene")
        try {
            const scene = await session.set(sessionInfo.id, sceneId ? ObjectId(sceneId) : undefined)
            io.to(sessionInfo.id.toString()).emit("set-scene", sceneId)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("update-scene", (id) => {
        console.log("Received package: update-scene")
        if (id) sessionInfo.scene = ObjectId(id)
    })
    socket.on("change-state", async (callback) => {
        console.log("Received package: change-state")
        try {
            await session.sync(sessionInfo.id, !sessionInfo.synced)
            sessionInfo.synced = !sessionInfo.synced
            io.to(sessionInfo.id.toString()).emit("change-state", sessionInfo.synced, sessionInfo.scene)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Doors
    socket.on("toggle-door", async (id, state, callback) => {
        console.log("Received package: toggle-door")
        try {
            await scene.toggleDoor(sessionInfo.scene, ObjectId(id), state)
            io.to(sessionInfo.id.toString()).emit("toggle-door", id, state)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-door", async (json, callback) => {
        console.log("Received package: modify-door")
        try {
            await scene.modifyDoor(sessionInfo.scene, JSON.parse(json))
            io.to(sessionInfo.id.toString()).emit("modify-door", json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Lights
    socket.on("create-light", async (json, callback) => {
        console.log("Received package: create-light")
        try {
            const data = await scene.createLight(sessionInfo.scene, JSON.parse(json))
            io.to(sessionInfo.id.toString()).emit("create-light", data)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-light", async (json, callback) => {
        console.log("Received package: modify-light")
        try {
            const data = await scene.modifyLight(sessionInfo.scene, JSON.parse(json))
            io.to(sessionInfo.id.toString()).emit("modify-light", data)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-light", async (id, callback) => {
        console.log("Received package: remove-light")
        try {
            await scene.removeLight(sessionInfo.scene, ObjectId(id))
            io.to(sessionInfo.id.toString()).emit("remove-light", id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Tools
    socket.on("ping", (position, strong) => {
        console.log("Received package: ping")
        io.to(sessionInfo.id.toString()).emit("ping", position, strong)
    })

    socket.on("modify-initiatives", async (json, callback) => {
        console.log("Received package: modify-initiatives")
        try {
            if (!json) {
                await scene.setInitiatives(sessionInfo.scene, null)
            } else {
                const list = []
                for (let i = 0; i < json.length; i++) {
                    const element = json[i]
                    list.push(JSON.parse(element))
                }
                await scene.setInitiatives(sessionInfo.scene, list)
            }
            io.to(sessionInfo.id.toString()).emit("modify-initiatives", json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Scenes
    socket.on("get-scene", async (id, callback) => {
        console.log("Received package: get-scene")
        try {
            const data = await scene.get(ObjectId(id))
            callback(true, data, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("get-scenes", async (callback) => {
        console.log("Received package: get-scenes")
        try {
            const result = await scene.getAll(sessionInfo.id)
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("upload-scene", async (
        path, json, image, callback
    ) => {
        console.log("Received package: upload-scene")
        try {
            const data = JSON.parse(json)

            const upload = await scene.create(
                sessionInfo.id, path, new sceneModel({
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
                }), image
            )
            callback(true, scene)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-scene", async (id, path, callback) => {
        console.log("Received package: remove-scene")
        try {
            const requireUpdate = await scene.remove(sessionInfo.id, path, ObjectId(id))
            if (requireUpdate) io.to(sessionInfo.id.toString()).emit("change-state", false, "")
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-scene", async (id, json, callback) => {
        console.log("Received package: modify-scene")
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
    socket.on("move-scene", async (
        id, oldPath, newPath, callback
    ) => {
        console.log("Received package: move-scene")
        try {
            await scene.move(
                sessionInfo.id, ObjectId(id), oldPath, newPath
            )
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("create-scene-folder", async (path, name, callback) => {
        console.log("Received package: create-scene-folder")
        try {
            const id = await scene.createFolder(sessionInfo.id, path, name)
            callback(true, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-scene-folder", async (path, callback) => {
        console.log("Received package: remove-scene-folder")
        try {
            const requireUpdate = await scene.removeFolder(sessionInfo.id, path)
            if (requireUpdate) io.to(sessionInfo.id.toString()).emit("change-state", false)

            callback(true, requireUpdate)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("rename-scene-folder", async (path, name, callback) => {
        console.log("Received package: rename-scene-folder")
        try {
            await scene.renameFolder(sessionInfo.id, path, name)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-scene-folder", async (oldPath, newPath, callback) => {
        console.log("Received package: move-scene-folder")
        try {
            await scene.moveFolder(sessionInfo.id, oldPath, newPath)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Blueprints
    socket.on("get-blueprint", async (id, callback) => {
        console.log("Received package: get-blueprint")
        try {
            const bp = await blueprint.get(ObjectId(id))
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("get-blueprints", async (callback) => {
        console.log("Received package: get-blueprints")
        try {
            const result = await blueprint.getAll(sessionInfo.id)
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("create-blueprint", async (
        path, json, image, callback
    ) => {
        console.log("Received package: create-blueprint")
        try {
            const data = JSON.parse(json)
            const result = await blueprint.create(
                sessionInfo.id, path, new blueprintModel({
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
                }), image
            )
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-blueprint", async (id, path, callback) => {
        console.log("Received package: remove-blueprint")
        try {
            await blueprint.remove(sessionInfo.id, path, ObjectId(id))
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-blueprint", async (
        id, json, image, callback
    ) => {
        console.log("Received package: modify-blueprint")
        try {
            const data = JSON.parse(json)
            const bp = await blueprint.modify(ObjectId(id), new blueprintModel(data), image)
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("set-permissions", async (blueprintId, json, callback) => {
        console.log("Received package: set-permissions")
        try {
            const list = []
            for (let i = 0; i < json.length; i++) {
                const element = JSON.parse(json[i])
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
    socket.on("refresh-permissions", async (blueprintId, callback) => {
        console.log("Received package: refresh-permissions")
        try {
            const bp = await blueprint.refreshPermissions(sessionInfo.id, ObjectId(blueprintId))
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-blueprint", async (
        id, oldPath, newPath, callback
    ) => {
        console.log("Received package: move-blueprint")
        try {
            await blueprint.move(
                sessionInfo.id, ObjectId(id), oldPath, newPath
            )
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("create-blueprint-folder", async (path, name, callback) => {
        console.log("Received package: create-blueprint-folder")
        try {
            const id = await blueprint.createFolder(sessionInfo.id, path, name)
            callback(true, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-blueprint-folder", async (path, callback) => {
        console.log("Received package: remove-blueprint-folder")
        try {
            await blueprint.removeFolder(sessionInfo.id, path)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("rename-blueprint-folder", async (path, name, callback) => {
        console.log("Received package: rename-blueprint-folder")
        try {
            await blueprint.renameFolder(sessionInfo.id, path, name)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-blueprint-folder", async (oldPath, newPath, callback) => {
        console.log("Received package: move-blueprint-folder")
        try {
            await blueprint.moveFolder(sessionInfo.id, oldPath, newPath)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Notes
    socket.on("get-note", async (id, callback) => {
        console.log("Received package: get-note")
        try {
            const data = await notes.get(ObjectId(id))
            callback(true, data, data._id.toString())
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("get-notes", async (id, callback) => {
        console.log("Received package: get-notes")
        try {
            const data = await notes.getAll(ObjectId(id))
            callback(true, data)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("create-note", async (json, callback) => {
        console.log("Received package: create-note")
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

            io.to(sessionInfo.id.toString()).emit("create-note", data, id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-note-text", async (id, text, callback) => {
        console.log("Received package: modify-note-text")
        try {
            await notes.modifyText(ObjectId(id), text)
            io.to(sessionInfo.id.toString()).emit("modify-note-text", id, text)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-note-header", async (id, text, callback) => {
        console.log("Received package: modify-note-header")
        try {
            await notes.modifyHeader(ObjectId(id), text)
            io.to(sessionInfo.id.toString()).emit("modify-note-header", id, text)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-note-image", async (id, buffer, callback) => {
        console.log("Received package: modify-note-image")
        try {
            const newImage = await notes.modifyImage(ObjectId(id), buffer)
            io.to(sessionInfo.id.toString()).emit("modify-note-image", id, newImage)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-note", async (id, callback) => {
        console.log("Received package: remove-note")
        try {
            await notes.remove(sessionInfo.scene, ObjectId(id))
            io.to(sessionInfo.id.toString()).emit("remove-note", id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-note", async (id, position, callback) => {
        console.log("Received package: move-note")
        try {
            await notes.move(ObjectId(id), JSON.parse(position))
            io.to(sessionInfo.id.toString()).emit("move-note", id, position)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("set-note-state", async (id, isPublic, callback) => {
        console.log("Received package: set-note-state")
        try {
            await notes.setPublic(ObjectId(id), isPublic)
            io.to(sessionInfo.id.toString()).emit("set-note-state", id, isPublic)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("show-note", async (id, callback) => {
        console.log("Received package: show-note")
        try {
            socket.to(sessionInfo.id.toString()).emit("show-note", id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion

    // #region Journals
    socket.on("get-journal", async (id, callback) => {
        console.log("Received package: get-journal")
        try {
            const data = await journals.get(ObjectId(id))
            callback(true, data)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("get-journals", async (callback) => {
        console.log("Received package: get-journals")
        try {
            const result = await journals.getAll(sessionInfo.id, accountInfo.uid)
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("create-journal", async (path, json, callback) => {
        console.log("Received package: create-journal")
        try {
            const data = JSON.parse(json)
            data.owner = accountInfo.uid

            const result = await journals.create(sessionInfo.id, path, new journalModel({
                owner: data.owner,
                header: data.header,
                text: data.text,
                image: undefined,
                collaborators: data.collaborators
            }))
            callback(true, result)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-journal", async (id, path, callback) => {
        console.log("Received package: remove-journal")
        try {
            await journals.remove(
                sessionInfo.id, path, accountInfo.uid, ObjectId(id)
            )
            io.to(sessionInfo.id.toString()).emit("remove-journal", id)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-journal-text", async (id, text, callback) => {
        console.log("Received package: modify-journal-text")
        try {
            await journals.modifyText(ObjectId(id), text)
            io.to(sessionInfo.id.toString()).emit("modify-journal-text", id, text)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-journal-header", async (id, text, callback) => {
        console.log("Received package: modify-journal-header")
        try {
            await journals.modifyHeader(ObjectId(id), text)
            io.to(sessionInfo.id.toString()).emit("modify-journal-header", id, text)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("modify-journal-image", async (id, buffer, callback) => {
        console.log("Received package: modify-journal-image")
        try {
            const newImage = await journals.modifyImage(ObjectId(id), buffer)
            io.to(sessionInfo.id.toString()).emit("modify-journal-image", id, newImage)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("show-journal", async (data, callback) => {
        console.log("Received package: show-journal")
        try {
            socket.to(sessionInfo.id.toString()).emit("show-journal", data)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("set-collaborators", async (journalId, json, callback) => {
        console.log("Received package: set-collaborators")
        try {
            const list = []
            for (let i = 0; i < json.length; i++) {
                const element = JSON.parse(json[i])
                list.push({
                    user: ObjectId(element.user),
                    isCollaborator: element.isCollaborator
                })
            }
            await journals.setCollaborators(ObjectId(journalId), list, sessionInfo.id)
            socket.to(sessionInfo.id.toString()).emit("set-collaborators", journalId, json)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("refresh-collaborators", async (blueprintId, callback) => {
        console.log("Received package: refresh-collaborators")
        try {
            const bp = await journals.refreshCollaborators(sessionInfo.id, ObjectId(blueprintId))
            callback(true, bp)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-journal", async (
        id, oldPath, newPath, callback
    ) => {
        console.log("Received package: move-journal")
        try {
            await journals.move(
                sessionInfo.id, ObjectId(id), oldPath, newPath
            )
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })

    socket.on("create-journal-folder", async (path, name, callback) => {
        console.log("Received package: create-journal-folder")
        try {
            const id = await journals.createFolder(
                sessionInfo.id, path, accountInfo.uid, name
            )
            callback(true, id)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("remove-journal-folder", async (path, callback) => {
        console.log("Received package: remove-journal-folder")
        try {
            await journals.removeFolder(sessionInfo.id, path, accountInfo.uid)
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("rename-journal-folder", async (path, name, callback) => {
        console.log("Received package: rename-journal-folder")
        try {
            await journals.renameFolder(
                sessionInfo.id, path, accountInfo.uid, name
            )
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    socket.on("move-journal-folder", async (oldPath, newPath, callback) => {
        console.log("Received package: move-journal-folder")
        try {
            await journals.moveFolder(
                sessionInfo.id, oldPath, newPath, accountInfo.uid
            )
            callback(true)
        } catch (e) {
            console.error(e)
            callback(false, e.message)
        }
    })
    // #endregion
})