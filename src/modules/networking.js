const { MongoClient, ObjectId, GridFSBucket } = require('mongodb')
const { fileModel } = require('../schemas')

let networking = {}

let db
let gfs
// Functions
/**
 * Starts the database
 * @returns {void} void
 */
networking.startDatabase = async () => {
    const client = await new MongoClient('mongodb://127.0.0.1:27017').connect()

    db = client.db('rpg-viewer')
    gfs = new GridFSBucket(db)
    networking.db = db
    networking.gfs = gfs
}

/**
 * Uploads file to GridFS collection
 * @param {ObjectId} id id of the file
 * @param {String} base64 file data as base64 String
 * @returns {Promise<void>} promise
 */
networking.uploadFile = (id, base64) => {
    return new Promise(async (resolve, reject) => {
        let stream = gfs.openUploadStreamWithId(id, id.toString())

        stream.write(Buffer.from(base64, 'base64'), async (callback) => {
            stream.end()
            const check = await fileModel.findById(id).exec()
            if (!check) {
                const reference = await fileModel.create(new fileModel({
                    _id: id,
                    count: 1
                }))

                if (reference) resolve()
                else reject('Failed to create reference collection')
            } else resolve()
        })
    })
}

networking.downloadFile = (id) => {
    return new Promise(async (resolve, reject) => {
        let exists = false
        const cursor = await gfs.find({ _id: id })
        await cursor.forEach(doc => exists = true);

        if (!exists) reject('File not found')
        else {
            let stream = gfs.openDownloadStream(id)
            const chunks = []

            stream.on('readable', () => {
                let chunk;
                while (null !== (chunk = stream.read())) chunks.push(chunk);
            })

            stream.on('end', () => {
                let buff = Buffer.concat(chunks).toString('base64')
                resolve(buff)
            })
        }
    })
}

networking.modifyFile = (id, increment) => {
    return new Promise(async (resolve, reject) => {
        const file = await fileModel.findById(id).exec()
        if (file) {
            if (file.count < 2 && increment < 0) {
                networking.deleteFile(id)
                const remove = await fileModel.findByIdAndRemove(id).exec()
            } else await fileModel.findOneAndUpdate(id, { $inc: { count: increment } }).exec()
            resolve()
        } else resolve()
    })
}

networking.deleteFile = async (id) => {
    return new Promise(async (resolve, reject) => {
        let exists = false
        const cursor = await gfs.find({ _id: id })
        await cursor.forEach(doc => exists = true);

        if (!exists) resolve()
        else await gfs.delete(id, (callback) => {
            if (callback) reject(callback)
            resolve()
        })
    })
}

module.exports = networking