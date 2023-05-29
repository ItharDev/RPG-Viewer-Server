const { ObjectId } = require("mongodb")

/**
 * Get-folder handler
 * @param {Array} collection
 * @param {string} path
 * @returns {Promise<{path: string, name: string, contents: Array<ObjectId>, folders: {}} | null>}
*/
module.exports = async (collection, path) => {
    if (!path) return null

    const nestedPath = path.replace(/\//g, ".folders.")
    const folders = collection.folders
    const targetFolder = nestedPath.split(".").reduce((p, c) => p[c], folders)
    return {
        path: nestedPath,
        name: targetFolder.name,
        contents: targetFolder.contents,
        folders: targetFolder.folders
    }
}