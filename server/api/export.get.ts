import {getDb} from '~/server/utils/db'

export default defineEventHandler((event) => {
    const db = getDb()

    const modules = db.prepare('SELECT * FROM modules ORDER BY name').all() as any[]
    const allTasks = db.prepare('SELECT * FROM tasks ORDER BY module_name, id').all() as any[]

    const data = modules.map((m) => {
        const tasks = allTasks
            .filter((t) => t.module_name === m.name)
            .map(({module_name: _mn, ...t}) => ({
                ...t,
                code: Boolean(t.code),
                interview: Boolean(t.interview),
                quiz: Boolean(t.quiz),
                completed: Boolean(t.completed),
            }))

        return {
            ...m,
            coreCompleted: tasks.filter((t: any) => t.type === 'CORE' && t.completed).length,
            advCompleted: tasks.filter((t: any) => t.type === 'ADV' && t.completed).length,
            tasks,
        }
    })

    const timestamp = new Date().toISOString().slice(0, 10)
    setHeader(event, 'Content-Disposition', `attachment; filename="module-progress-${timestamp}.json"`)
    setHeader(event, 'Content-Type', 'application/json')

    return data
})
