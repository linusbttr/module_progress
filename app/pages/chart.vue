<script setup lang="ts">
import type {SubjectModule} from '~/types'

const {data: modules} = await useFetch<SubjectModule[]>('/api/modules')

function calculateGrades(subject: string, coreCompleted: number, advCompleted: number): [number, number] {
    let semesterGrade = 5
    let yearGrade = 5

    switch (subject) {
        case 'WEBT':
            if (coreCompleted >= 4) {
                semesterGrade = 4
                if (advCompleted >= 1) semesterGrade = 3
                if (advCompleted >= 2) semesterGrade = 2
                if (advCompleted >= 4) semesterGrade = 1
            }
            if (coreCompleted >= 8) {
                yearGrade = 4
                if (advCompleted >= 2) yearGrade = 3
                if (advCompleted >= 4) yearGrade = 2
                if (advCompleted >= 8) yearGrade = 1
            }
            break

        case 'SEW':
            if (coreCompleted >= 5) {
                semesterGrade = Math.max(1, 4 - Math.min(advCompleted, 3))
            }
            if (coreCompleted >= 9) {
                yearGrade = Math.max(1, 4 - Math.floor(advCompleted / 2))
            }
            break

        case 'CMS':
            if (coreCompleted >= 3) {
                semesterGrade = Math.max(1, 4 - Math.min(advCompleted, 3))
            }
            if (coreCompleted >= 5) {
                yearGrade = Math.max(1, 4 - Math.floor(advCompleted / 2))
            }
            break
    }

    return [semesterGrade, yearGrade]
}

const enriched = computed(() =>
    (modules.value ?? []).map((m) => {
        const [semesterGrade, yearGrade] = calculateGrades(m.name, m.coreCompleted, m.advCompleted)
        const coreTasks = m.tasks.filter((t) => t.type === 'CORE').length
        const advTasks = m.tasks.filter((t) => t.type === 'ADV').length
        return {...m, semesterGrade, yearGrade, coreTasks, advTasks}
    }),
)
</script>

<template>
    <div class="chart-grid">
        <div v-for="m in enriched" :key="m.name" class="subject-card">

            <!-- Header -->
            <div class="card-head">
                <h2>{{ m.name }}</h2>
                <div class="grade-row">
                    <div class="grade-chip" :class="`grade-${m.semesterGrade}`">
                        <span class="grade-label">Semester</span>
                        <span class="grade-value">{{ m.semesterGrade }}</span>
                    </div>
                    <div class="grade-chip" :class="`grade-${m.yearGrade}`">
                        <span class="grade-label">Year</span>
                        <span class="grade-value">{{ m.yearGrade }}</span>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-area">
                <!-- CORE -->
                <div class="chart-group">
                    <p class="group-label">CORE</p>
                    <div class="chart-pair">
                        <div class="chart-item">
                            <div class="donut-container">
                                <DonutChart
                                    :values="[m.coreCompleted, Math.max(0, m.coreRequiredSemester - m.coreCompleted)]"
                                />
                                <div class="donut-center">
                                    <span class="center-count">{{ m.coreCompleted }}</span>
                                    <span class="center-total">/{{ m.coreRequiredSemester }}</span>
                                </div>
                            </div>
                            <p class="chart-label">Semester</p>
                        </div>
                        <div class="chart-item">
                            <div class="donut-container">
                                <DonutChart
                                    :values="[m.coreCompleted, Math.max(0, m.coreRequiredYear - m.coreCompleted)]"
                                />
                                <div class="donut-center">
                                    <span class="center-count">{{ m.coreCompleted }}</span>
                                    <span class="center-total">/{{ m.coreRequiredYear }}</span>
                                </div>
                            </div>
                            <p class="chart-label">Year</p>
                        </div>
                    </div>
                </div>

                <div class="divider"/>

                <!-- ADV -->
                <div class="chart-group">
                    <p class="group-label">ADV</p>
                    <div class="chart-pair">
                        <div class="chart-item">
                            <div class="donut-container">
                                <DonutChart
                                    :values="[m.advCompleted, Math.max(0, m.advRequiredSemester - m.advCompleted)]"
                                    :colors="['#7c5cbf', '#2e2e2e']"
                                />
                                <div class="donut-center">
                                    <span class="center-count" style="color:#9b7de0">{{ m.advCompleted }}</span>
                                    <span class="center-total">/{{ m.advRequiredSemester }}</span>
                                </div>
                            </div>
                            <p class="chart-label">Semester</p>
                        </div>
                        <div class="chart-item">
                            <div class="donut-container">
                                <DonutChart
                                    :values="[m.advCompleted, Math.max(0, m.advRequiredYear - m.advCompleted)]"
                                    :colors="['#7c5cbf', '#2e2e2e']"
                                />
                                <div class="donut-center">
                                    <span class="center-count" style="color:#9b7de0">{{ m.advCompleted }}</span>
                                    <span class="center-total">/{{ m.advRequiredYear }}</span>
                                </div>
                            </div>
                            <p class="chart-label">Year</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task count bar -->
            <div class="task-summary">
                <div class="summary-bar">
                    <div
                        class="bar-fill core-fill"
                        :style="{ width: `${m.coreTasks ? (m.coreCompleted / m.coreTasks) * 100 : 0}%` }"
                    />
                </div>
                <span class="summary-text">{{ m.coreCompleted }}/{{ m.coreTasks }} Core · {{
                        m.advCompleted
                    }}/{{ m.advTasks }} Adv</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.chart-grid {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
}

/* ── Card ─────────────────────────────────────────────────── */
.subject-card {
    background: #242424;
    border: 1px solid #2e2e2e;
    border-radius: 10px;
    padding: 20px;
    min-width: 300px;
    flex: 1;
    max-width: 380px;
}

/* ── Header ───────────────────────────────────────────────── */
.card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

h2 {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.grade-row {
    display: flex;
    gap: 8px;
}

.grade-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5px 10px;
    border-radius: 6px;
    background: #2d2d2d;
    min-width: 52px;
}

.grade-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #555;
}

.grade-value {
    font-size: 18px;
    font-weight: 800;
    line-height: 1.2;
    color: #888;
}

.grade-1 .grade-value {
    color: #6fcf6f;
}

.grade-2 .grade-value {
    color: #5abf5a;
}

.grade-3 .grade-value {
    color: #cfcf50;
}

.grade-4 .grade-value {
    color: #cf8f30;
}

.grade-5 .grade-value {
    color: #cf5050;
}

/* ── Chart layout ─────────────────────────────────────────── */
.charts-area {
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

.divider {
    width: 1px;
    background: #2e2e2e;
    align-self: stretch;
}

.chart-group {
    flex: 1;
}

.group-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #444;
    margin-bottom: 10px;
    text-align: center;
}

.chart-pair {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.chart-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

/* Donut with centered text overlay */
.donut-container {
    position: relative;
    width: 120px;
    height: 120px;
}

.donut-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.center-count {
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    color: #e46b09;
}

.center-total {
    font-size: 11px;
    color: #555;
}

.chart-label {
    font-size: 11px;
    color: #666;
    text-align: center;
}

/* ── Task summary bar ─────────────────────────────────────── */
.task-summary {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.summary-bar {
    height: 4px;
    background: #2e2e2e;
    border-radius: 2px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
}

.core-fill {
    background: #e46b09;
}

.summary-text {
    font-size: 11px;
    color: #555;
    text-align: center;
}
</style>
