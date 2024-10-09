const { ObjectId } = require("mongodb")
const { model, Schema } = require("mongoose")

const blueprintModel = model("blueprints", new Schema({
    permissions: Array({
        _id: false,
        user: ObjectId,
        type: { type: Number },
    }),
    visible: Array({
        _id: false,
        user: ObjectId,
        visible: Boolean
    }),
    dimensions: {
        x: Number,
        y: Number
    },
    name: String,
    type: { type: Number },
    visionRadius: Number,
    nightRadius: Number,
    light: ObjectId,
    image: ObjectId,
    art: {}
}))

const tokenModel = model("tokens", new Schema({
    permissions: Array({
        _id: false,
        user: ObjectId,
        type: { type: Number },
    }),
    visible: Array({
        _id: false,
        user: ObjectId,
        visible: Boolean
    }),
    dimensions: {
        x: Number,
        y: Number
    },
    position: {
        x: Number,
        y: Number
    },
    name: String,
    type: { type: Number },
    visionRadius: Number,
    nightRadius: Number,
    light: ObjectId,
    image: ObjectId,
    art: {},
    enabled: Boolean,
    health: Number,
    elevation: Number,
    conditions: Number,
    locked: Boolean,
    rotation: Number,
    lightRotation: Number,
    lightEnabled: Boolean,
    teleportProtection: Boolean,
}))

const lightModel = model("lights", new Schema({
    name: String,
    primary: {
        radius: Number,
        angle: Number,
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
        },
        effect: {
            type: { type: Number },
            strength: Number,
            frequency: Number
        }
    },
    secondary: {
        radius: Number,
        angle: Number,
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
        },
        effect: {
            type: { type: Number },
            strength: Number,
            frequency: Number
        }
    }
}))

const sceneModel = model("scenes", new Schema({
    info: {
        image: ObjectId,
        name: String,
    },
    darkness: {
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
        },
        enabled: Boolean,
        globalLighting: Boolean,
        visionRange: Number
    },
    grid: {
        cellSize: Number,
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
        },
        unit: {
            name: String,
            scale: Number
        },
        dimensions: {
            x: Number,
            y: Number
        },
        enabled: Boolean,
        position: {
            x: Number,
            y: Number
        },
        snapToGrid: Boolean
    },
    walls: Array({
        _id: false,
        id: ObjectId,
        points: Array({
            _id: false,
            x: Number,
            y: Number
        }),
        type: { type: Number },
        open: Boolean,
        locked: Boolean
    }),
    portals: Array({
        _id: false,
        id: ObjectId,
        position: {
            x: Number,
            y: Number
        },
        link: ObjectId,
        radius: Number,
        continuous: Boolean,
        active: Boolean
    }),
    tokens: Array(ObjectId),
    initiatives: {},
    lights: {},
    notes: {}
}))

const sessionModel = model("sessions", new Schema({
    name: String,
    master: ObjectId,
    users: Array(ObjectId),
    presets: Array(ObjectId),
    state: {
        scene: ObjectId,
        synced: Boolean
    },
    blueprints: {},
    scenes: {},
    journals: {},
    background: ObjectId,
    nightVisionStrength: Number
}))

const userModel = model("users", new Schema({
    email: String,
    name: String,
    password: String,
    licences: Array(ObjectId)
}))

const fileModel = model("files", new Schema({
    count: Number
}))

const noteModel = model("notes", new Schema({
    header: String,
    text: String,
    image: ObjectId,
}))

const journalModel = model("journals", new Schema({
    owner: ObjectId,
    header: String,
    text: String,
    image: ObjectId,
    collaborators: Array({
        _id: false,
        user: ObjectId,
        isCollaborator: Boolean
    })
}))

module.exports = {
    blueprintModel,
    tokenModel,
    sceneModel,
    sessionModel,
    userModel,
    fileModel,
    noteModel,
    journalModel,
    lightModel
}
