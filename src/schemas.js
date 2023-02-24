const { ObjectId } = require('mongodb')
const { model, Schema } = require('mongoose')

const blueprintModel = model('blueprints', new Schema({
    name: String,
    type: Number,
    permissions: Array({
        _id: false,
        user: ObjectId,
        permission: Number
    }),
    dimensions: {
        x: Number,
        y: Number
    },
    hasVision: Boolean,
    nightVision: Boolean,
    highlighted: Boolean,
    lightRadius: Number,
    lightEffect: Number,
    lightColor: {
        r: Number,
        g: Number,
        b: Number,
        a: Number
    },
    lightIntensity: Number,
    flickerFrequency: Number,
    flickerAmount: Number,
    pulseInterval: Number,
    pulseAmount: Number,
    image: ObjectId,
}))

const tokenModel = model('tokens', new Schema({
    name: String,
    type: Number,
    permissions: Array({
        _id: false,
        user: ObjectId,
        permission: Number
    }),
    dimensions: {
        x: Number,
        y: Number
    },
    hasVision: Boolean,
    nightVision: Boolean,
    highlighted: Boolean,
    lightRadius: Number,
    lightEffect: Number,
    lightColor: {
        r: Number,
        g: Number,
        b: Number,
        a: Number
    },
    lightIntensity: Number,
    flickerFrequency: Number,
    flickerAmount: Number,
    pulseInterval: Number,
    pulseAmount: Number,
    image: ObjectId,
    position: {
        x: Number,
        y: Number
    },
    enabled: Boolean,
    health: Number,
    elevation: String,
    conditions: Number,
    locked: Boolean,
    rotation: Number
}))

const sceneModel = model('scenes', new Schema({
    data: {
        image: ObjectId,
        name: String,
        nightStrength: Number
    },
    fogOfWar: {
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
        },
        enabled: Boolean,
        globalLighting: Boolean,
        translucency: Number,
        nightVisionStrength: Number
    },
    grid: {
        cellSize: Number,
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
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
        wallId: ObjectId,
        points: Array({
            _id: false,
            x: Number, y: Number
        }),
        model: Number,
        open: Boolean,
        locked: Boolean
    }),
    tokens: Array(ObjectId),
    initiatives: Array({
        _id: false,
        index: Number,
        name: String,
        roll: String,
        visible: Boolean
    }),
    lights: Array({
        _id: false,
        id: ObjectId,
        radius: Number,
        enabled: Boolean,
        position: {
            x: Number,
            y: Number
        },
        intensity: Number,
        flickerFrequency: Number,
        flickerAmount: Number,
        pulseInterval: Number,
        pulseAmount: Number,
        effect: Number,
        color: {
            r: Number,
            g: Number,
            b: Number,
            a: Number
        },
    }),
    notes: Array(ObjectId)
}))

const sessionModel = model('sessions', new Schema({
    name: String,
    master: ObjectId,
    users: Array(ObjectId),
    state: {
        synced: Boolean,
        scene: ObjectId
    },
    blueprints: Array,
    scenes: Array,
    journals: Array,
    background: ObjectId
}))

const userModel = model('users', new Schema({
    email: String,
    name: String,
    password: String,
    online: Boolean,
    licences: Array(ObjectId)
}))

const fileModel = model('files', new Schema({
    count: Number
}))

const noteModel = model('notes', new Schema({
    owner: ObjectId,
    header: String,
    text: String,
    image: ObjectId,
    isPublic: Boolean,
    position: {
        x: Number,
        y: Number
    },
}))

const journalModel = model('journals', new Schema({
    owner: ObjectId,
    header: String,
    text: String,
    image: ObjectId,
    collaborators: Array({
        _id: false,
        user: ObjectId,
        isCollaborator: Boolean
    }),
}))

module.exports = {
    blueprintModel,
    tokenModel,
    sceneModel,
    sessionModel,
    userModel,
    fileModel,
    noteModel,
    journalModel
}