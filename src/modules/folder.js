const { ObjectId } = require('mongodb')

module.exports = {
    get: async function (collection, path) {

        if (!path) {
            return undefined
        }
        let paths = path.split('/')
        let finalPath = ''
        let name = ''
        let contents = Array(ObjectId)
        let subFolders = Array({})

        const rootFolder = collection.indexOf(collection.find(obj => obj.id.toString() == paths[0]))
        finalPath += rootFolder
        const f = collection[rootFolder]
        name = f.name
        contents = f.contents
        subFolders = f.subFolders

        collection = subFolders

        for (let i = 1; i < paths.length; i++) {
            const element = paths[i];
            const folder = collection.find(obj => obj.id.toString() == element)
            name = folder.name
            contents = folder.contents
            subFolders = folder.subFolders

            if (i < paths.length - 2 ) {
                finalPath += `.${collection.indexOf(folder)}.subFolders`
            } else if (i === paths.length - 1) {
                if (finalPath.includes('subFolders')) finalPath += `.${collection.indexOf(folder)}`
                else finalPath += `.subFolders.${collection.indexOf(folder)}`
            }

            collection = subFolders
        }

        return {
            path: finalPath,
            name: name,
            contents: contents,
            subFolders: subFolders
        }
    }
}