<script lang="ts" setup>
import type {SubjectModule, CheckboxField} from '~/types'

const {data: modules, refresh} = await useFetch<SubjectModule[]>('/api/modules')

const saving = ref<string | null>(null) // 'moduleName:taskId'

function gradeLabel(subject: string, coreCompleted: number, advCompleted: number, period: 'semester' | 'year') {
    let grade = 5

    if (subject === 'WEBT') {
        const coreReq = period === 'semester' ? 4 : 8
        const advThresholds = period === 'semester' ? [1, 2, 4] : [2, 4, 8]
        if (coreCompleted >= coreReq) {
            grade = 4
            if (advCompleted >= advThresholds[0]) grade = 3
            if (advCompleted >= advThresholds[1]) grade = 2
            if (advCompleted >= advThresholds[2]) grade = 1
        }
    } else if (subject === 'SEW') {
        const coreReq = period === 'semester' ? 5 : 9
        if (coreCompleted >= coreReq) {
            grade = 4
            grade -= period === 'semester' ? Math.min(advCompleted, 3) : Math.floor(advCompleted / 2)
            grade = Math.max(1, grade)
        }
    } else if (subject === 'CMS') {
        const coreReq = period === 'semester' ? 3 : 5
        if (coreCompleted >= coreReq) {
            grade = 4
            grade -= period === 'semester' ? Math.min(advCompleted, 3) : Math.floor(advCompleted / 2)
            grade = Math.max(1, grade)
        }
    }

    return grade
}

async function toggle(module: SubjectModule, taskId: number, field: CheckboxField) {
    if (!modules.value) return
    const key = `${module.name}:${taskId}`
    saving.value = key

    const task = module.tasks.find((t) => t.id === taskId)!
    const newValue = !task[field]

    // Optimistic update
    task[field] = newValue
    task.completed = task.code && task.interview && task.quiz
    if (task.completed) {
        if (task.type === 'CORE') module.coreCompleted++
        else module.advCompleted++
    } else if (!newValue) {
        // Revert count if it was completed before
        if (task.type === 'CORE' && module.coreCompleted > 0) module.coreCompleted--
        else if (task.type === 'ADV' && module.advCompleted > 0) module.advCompleted--
    }

    try {
        await $fetch(`/api/tasks/${module.name}/${taskId}`, {
            method: 'PATCH',
            body: {field, value: newValue},
        })
    } catch {
        // Revert on error
        await refresh()
    } finally {
        saving.value = null
    }
}
</script>

<template>
    <section class="grid">
        <div v-for="m in modules" :key="m.name" class="module-card">
            <!-- Card Header -->
            <div class="card-header">
                <div class="header-top">
                    <h2>{{ m.name }}</h2>
                    <div class="grade-badges">
            <span :class="`grade-${gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'semester')}`" class="badge">
              SEM {{ gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'semester') }}
            </span>
                        <span :class="`grade-${gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'year')}`"
                              class="badge">
              YEAR {{ gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'year') }}
            </span>
                    </div>
                </div>
                <div class="progress-row">
                    <span class="progress-label">CORE {{
                            m.coreCompleted
                        }} / {{ m.tasks.filter(t => t.type === 'CORE').length }}</span>
                    <span class="progress-label">ADV {{
                            m.advCompleted
                        }} / {{ m.tasks.filter(t => t.type === 'ADV').length }}</span>
                </div>
            </div>

            <!-- Column labels -->
            <div class="task-row header-row">
                <span class="task-type"/>
                <span class="task-title"/>
                <div class="task-checks">
                    <span>Code</span>
                    <span>Interview</span>
                    <span>Quiz</span>
                </div>
            </div>

            <!-- Tasks grouped by type -->
            <template v-for="group in ['CORE', 'ADV']" :key="group">
                <div class="group-divider">{{ group }}</div>
                <div
                    v-for="task in m.tasks.filter(t => t.type === group)"
                    :key="task.id"
                    :class="{ completed: task.completed, saving: saving === `${m.name}:${task.id}` }"
                    class="task-row"
                >
                    <span class="task-num">{{ task.number || '—' }}</span>
                    <span class="task-title">{{ task.title }}</span>
                    <div class="task-checks">
                        <label class="check-wrap" title="Code">
                            <input
                                :checked="task.code"
                                :disabled="saving === `${m.name}:${task.id}`"
                                type="checkbox"
                                @change="toggle(m, task.id, 'code')"
                            />
                        </label>
                        <label class="check-wrap" title="Interview">
                            <input
                                :checked="task.interview"
                                :disabled="saving === `${m.name}:${task.id}`"
                                type="checkbox"
                                @change="toggle(m, task.id, 'interview')"
                            />
                        </label>
                        <label class="check-wrap" title="Quiz">
                            <input
                                :checked="task.quiz"
                                :disabled="saving === `${m.name}:${task.id}`"
                                type="checkbox"
                                @change="toggle(m, task.id, 'quiz')"
                            />
                        </label>
                    </div>
                </div>
            </template>
        </div>
    </section>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────── */
.grid {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

@media (max-width: 1100px) {
    .grid {
        flex-direction: column;
    }
}

/* ── Card ───────────────────────────────────────────────────── */
.module-card {
    flex: 1;
    min-width: 0;
    background: #242424;
    border: 1px solid #2e2e2e;
    border-radius: 10px;
    overflow: hidden;
}

/* ── Card Header ────────────────────────────────────────────── */
.card-header {
    padding: 16px 18px 10px;
    border-bottom: 1px solid #2e2e2e;
}

.header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

h2 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.grade-badges {
    display: flex;
    gap: 6px;
}

.badge {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 7px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    background: #2d2d2d;
    color: #999;
}

.grade-1 {
    background: #1a3a1a;
    color: #6fcf6f;
}

.grade-2 {
    background: #1a2e1a;
    color: #5abf5a;
}

.grade-3 {
    background: #2a2a1a;
    color: #cfcf50;
}

.grade-4 {
    background: #3a2a1a;
    color: #cf8f30;
}

.grade-5 {
    background: #3a1a1a;
    color: #cf5050;
}

.progress-row {
    display: flex;
    gap: 14px;
}

.progress-label {
    font-size: 11px;
    color: #666;
    font-weight: 500;
}

/* ── Column headers ─────────────────────────────────────────── */
.header-row {
    padding: 6px 12px 6px 18px !important;
    background: #1e1e1e;
    border-bottom: 1px solid #2a2a2a;
    opacity: 1 !important;
}

.header-row .task-checks span {
    font-size: 10px;
    font-weight: 600;
    color: #555;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    width: 60px;
    text-align: center;
}

/* ── Group divider ──────────────────────────────────────────── */
.group-divider {
    padding: 4px 18px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #444;
    background: #1e1e1e;
    border-bottom: 1px solid #2a2a2a;
}

/* ── Task rows ──────────────────────────────────────────────── */
.task-row {
    display: flex;
    align-items: center;
    padding: 9px 12px 9px 18px;
    border-bottom: 1px solid #2a2a2a;
    gap: 8px;
    transition: background 0.1s, opacity 0.2s;
}

.task-row:last-child {
    border-bottom: none;
}

.task-row:hover:not(.header-row) {
    background: #282828;
}

.task-row.completed {
    opacity: 0.25;
}

.task-row.saving {
    opacity: 0.6;
}

.task-num {
    font-size: 11px;
    color: #555;
    min-width: 24px;
    font-variant-numeric: tabular-nums;
}

.task-title {
    flex: 1;
    font-size: 13px;
    color: #ccc;
    line-height: 1.4;
}

/* ── Checkboxes ─────────────────────────────────────────────── */
.task-checks {
    display: flex;
    gap: 0;
}

.check-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    cursor: pointer;
}

.check-wrap input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: #e46b09;
    cursor: pointer;
}

.check-wrap input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
</style>
