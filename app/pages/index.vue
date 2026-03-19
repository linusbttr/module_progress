<script lang="ts" setup>
import type {SubjectModule, CheckboxField} from '~/types'

const {data: modules, refresh} = await useFetch<SubjectModule[]>('/api/modules')
const saving = ref<string | null>(null)

async function toggle(module: SubjectModule, taskId: number, field: CheckboxField) {
    const key = `${module.name}:${taskId}`
    saving.value = key
    const task = module.tasks.find(t => t.id === taskId)!
    const newValue = !task[field]

    // Optimistic update
    const wasCompleted = task.completed
    task[field] = newValue
    task.completed = task.code && task.interview && task.quiz
    if (!wasCompleted && task.completed) {
        if (task.type === 'CORE') module.coreCompleted++
        else module.advCompleted++
    } else if (wasCompleted && !task.completed) {
        if (task.type === 'CORE') module.coreCompleted--
        else module.advCompleted--
    }

    try {
        await $fetch(`/api/tasks/${module.name}/${taskId}`, {
            method: 'PATCH',
            body: {field, value: newValue},
        })
    } catch {
        await refresh()
    } finally {
        saving.value = null
    }
}

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
</script>

<template>
    <div class="columns">
        <div v-for="m in modules" :key="m.name" class="column">

            <!-- Subject header -->
            <div class="subject-header">
                <div class="subject-title">
                    <span class="subject-name">{{ m.name }}</span>
                    <span class="subject-counts">
                        <span :class="`grade-${gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'semester')}`"
                              class="badge count-chip">
                            SEM {{ gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'semester') }}
                        </span>
                        <span :class="`grade-${gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'year')}`"
                              class="badge count-chip">
                            YEAR {{ gradeLabel(m.name, m.coreCompleted, m.advCompleted, 'year') }}
                        </span>
                        <span class="count-chip core">{{ m.coreCompleted }}/{{
                                m.tasks.filter(t => t.type === 'CORE').length
                            }} core</span>
                        <span class="count-chip adv">{{ m.advCompleted }}/{{
                                m.tasks.filter(t => t.type === 'ADV').length
                            }} adv</span>
                      </span>
                </div>

                <!-- Progress bar -->
                <div class="progress-track">
                    <div
                        :style="{ width: `${(m.tasks.filter(t=>t.completed).length / m.tasks.length) * 100}%` }"
                        class="progress-fill"
                    />
                </div>
            </div>

            <!-- Check header -->
            <div class="check-header">
                <span/>
                <span class="check-labels">
          <span>C</span><span>I</span><span>Q</span>
        </span>
            </div>

            <!-- Task groups -->
            <template v-for="group in ['CORE', 'ADV']" :key="group">
                <div class="group-label">{{ group }}</div>
                <div
                    v-for="task in m.tasks.filter(t => t.type === group)"
                    :key="task.id"
                    :class="{ done: task.completed, saving: saving === `${m.name}:${task.id}` }"
                    class="task"
                >
                    <div class="task-left">
                        <span class="task-num">{{ task.number || '—' }}</span>
                        <span class="task-title">{{ task.title }}</span>
                    </div>
                    <div class="task-checks">
                        <label
                            v-for="field in (['code', 'interview', 'quiz'] as CheckboxField[])"
                            :key="field"
                            :class="{ checked: task[field] }"
                            class="cb"
                        >
                            <input
                                :checked="task[field]"
                                :disabled="saving === `${m.name}:${task.id}`"
                                type="checkbox"
                                @change="toggle(m, task.id, field)"
                            />
                            <span class="cb-box">
                <svg v-if="task[field]" fill="none" height="7" viewBox="0 0 9 7" width="9">
                  <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="1.5"/>
                </svg>
              </span>
                        </label>
                    </div>
                </div>
            </template>

        </div>
    </div>
</template>

<style scoped>
.columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    align-items: start;
}

@media (max-width: 1100px) {
    .columns {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 700px) {
    .columns {
        grid-template-columns: 1fr;
    }
}

/* ── Card ───────────────────────────────────────────────── */
.column {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

/* ── Subject header ─────────────────────────────────────── */
.subject-header {
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--border);
}

.subject-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.subject-name {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.subject-counts {
    display: flex;
    gap: 6px;
}

.count-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 3px;
    font-weight: 500;
}

.count-chip.core {
    background: #1a0f07;
    color: var(--accent);
    border: 1px solid var(--accent-dim);
}

.count-chip.adv {
    background: #0d1a2a;
    color: #60a5fa;
    border: 1px solid #1e3a5a;
}

.progress-track {
    height: 2px;
    background: var(--border-hi);
    border-radius: 1px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 1px;
    transition: width 0.4s ease;
}

/* ── Check header ───────────────────────────────────────── */
.check-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 16px;
    background: var(--faint);
    border-bottom: 1px solid var(--border);
}

.check-labels {
    display: flex;
    gap: 0;
}

.check-labels span {
    width: 32px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-transform: uppercase;
}

/* ── Group label ────────────────────────────────────────── */
.group-label {
    padding: 5px 16px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text);
    background: var(--bg);
    border-bottom: 1px solid var(--border);
}

/* ── Task row ───────────────────────────────────────────── */
.task {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 16px;
    border-bottom: 1px solid var(--border);
    gap: 8px;
    transition: background 0.1s, opacity 0.2s;
}

.task:last-child {
    border-bottom: none;
}

.task:hover {
    background: var(--faint);
}

.task.done {
    background: var(--accent-dim);
    opacity: 0.88;
}

.task.saving {
    opacity: 0.5;
    pointer-events: none;
}

.task-left {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.task-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text);
    flex-shrink: 0;
    width: 18px;
}

.task-title {
    font-size: 12px;
    color: var(--text);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── Custom checkboxes ──────────────────────────────────── */
.task-checks {
    display: flex;
    flex-shrink: 0;
}

.cb {
    width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.cb input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.cb-box {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid var(--border-hi);
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    transition: border-color 0.15s, background 0.15s;
}

.cb:hover .cb-box {
    border-color: var(--muted);
}

.cb.checked .cb-box {
    background: #1a0f07;
    border-color: var(--accent);
}
</style>
