import {getDb} from '../utils/db'

export default defineEventHandler(() => {
    const db = getDb()

    const modules = db.prepare('SELECT * FROM modules ORDER BY name').all() as any[]
    const allTasks = db.prepare('SELECT * FROM tasks ORDER BY module_name, id').all() as any[]

    return modules.map((m) => {
        const tasks = allTasks
            .filter((t) => t.module_name === m.name)
            .map((t) => ({
                id: t.id,
                module_name: t.module_name,
                type: t.type,
                number: t.number,
                title: t.title,
                code: Boolean(t.code),
                interview: Boolean(t.interview),
                quiz: Boolean(t.quiz),
                completed: Boolean(t.completed),
            }))

        return {
            ...m,
            coreCompleted: tasks.filter((t) => t.type === 'CORE' && t.completed).length,
            advCompleted: tasks.filter((t) => t.type === 'ADV' && t.completed).length,
            tasks,
        }
    })
})
