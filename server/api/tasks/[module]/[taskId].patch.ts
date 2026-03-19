import {getDb} from '#server/utils/db'

const ALLOWED_FIELDS = ['code', 'interview', 'quiz'] as const
type Field = (typeof ALLOWED_FIELDS)[number]

interface PatchBody {
    field: Field
    value: boolean
}

export default defineEventHandler(async (event) => {
    const {module: moduleName, taskId} = getRouterParams(event)
    const body = await readBody<PatchBody>(event)

    if (!ALLOWED_FIELDS.includes(body.field as Field)) {
        throw createError({statusCode: 400, message: `Invalid field "${body.field}"`})
    }

    const db = getDb()
    const id = Number(taskId)

    db.prepare(`UPDATE tasks
                SET ${body.field} = ?
                WHERE id = ?
                  AND module_name = ?`)
        .run(body.value ? 1 : 0, id, moduleName)

    const task = db
        .prepare('SELECT code, interview, quiz FROM tasks WHERE id = ? AND module_name = ?')
        .get(id, moduleName) as { code: number; interview: number; quiz: number } | undefined

    if (!task) {
        throw createError({statusCode: 404, message: 'Task not found'})
    }

    const completed = task.code && task.interview && task.quiz ? 1 : 0
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ? AND module_name = ?').run(completed, id, moduleName)

    return {success: true, completed: Boolean(completed)}
})
