import {getDb} from '../utils/db'
import {importData} from '../utils/db'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!Array.isArray(body) || body.length === 0) {
        throw createError({statusCode: 400, message: 'Body must be a non-empty array of modules'})
    }

    // Basic validation of structure
    for (const m of body) {
        if (typeof m.name !== 'string' || !Array.isArray(m.tasks)) {
            throw createError({statusCode: 400, message: 'Each module must have a name (string) and tasks (array)'})
        }
    }

    const db = getDb()
    importData(db, body)

    return {success: true, imported: body.length}
})
