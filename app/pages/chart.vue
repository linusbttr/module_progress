<script lang="ts" setup>
import type {SubjectModule} from '~/types'

const {data: modules} = await useFetch<SubjectModule[]>('/api/modules')

function calcGrades(name: string, core: number, adv: number): [number, number] {
    let s = 5, y = 5
    switch (name) {
        case 'WEBT':
            if (core >= 4) {
                s = 4;
                if (adv >= 1) s = 3;
                if (adv >= 2) s = 2;
                if (adv >= 4) s = 1
            }
            if (core >= 8) {
                y = 4;
                if (adv >= 2) y = 3;
                if (adv >= 4) y = 2;
                if (adv >= 8) y = 1
            }
            break
        case 'SEW':
            if (core >= 5) s = Math.max(1, 4 - Math.min(adv, 3))
            if (core >= 9) y = Math.max(1, 4 - Math.floor(adv / 2))
            break
        case 'CMS':
            if (core >= 3) s = Math.max(1, 4 - Math.min(adv, 3))
            if (core >= 5) y = Math.max(1, 4 - Math.floor(adv / 2))
            break
    }
    return [s, y]
}

const gradeColor: Record<number, string> = {
    1: '#22c55e', 2: '#4ade80', 3: '#eab308', 4: '#f97316', 5: '#ef4444'
}

const enriched = computed(() =>
    (modules.value ?? []).map(m => {
        const [sem, year] = calcGrades(m.name, m.coreCompleted, m.advCompleted)
        const coreTotal = m.tasks.filter(t => t.type === 'CORE').length
        const advTotal = m.tasks.filter(t => t.type === 'ADV').length
        const totalDone = m.tasks.filter(t => t.completed).length
        return {...m, sem, year, coreTotal, advTotal, totalDone}
    })
)
</script>

<template>
    <div class="chart-grid">
        <div v-for="m in enriched" :key="m.name" class="card">

            <!-- Header -->
            <div class="card-top">
                <span class="card-name">{{ m.name }}</span>
                <div class="grade-row">
                    <div class="grade-block">
                        <span class="grade-period">Semester</span>
                        <span :style="{ color: gradeColor[m.sem] }" class="grade-value">{{ m.sem }}</span>
                    </div>
                    <div class="grade-sep"/>
                    <div class="grade-block">
                        <span class="grade-period">Year</span>
                        <span :style="{ color: gradeColor[m.year] }" class="grade-value">{{ m.year }}</span>
                    </div>
                </div>
            </div>

            <!-- Donut rows -->
            <div class="donut-section">
                <div class="donut-row">
                    <span class="donut-label">CORE</span>
                    <div class="donut-pair">
                        <div class="donut-item">
                            <div class="donut-wrap">
                                <DonutChart
                                    :size="80"
                                    :values="[m.coreCompleted, Math.max(0, m.coreRequiredSemester - m.coreCompleted)]"/>
                                <div class="donut-text">
                                    <span class="dt-val">{{ m.coreCompleted }}</span>
                                    <span class="dt-max">/{{ m.coreRequiredSemester }}</span>
                                </div>
                            </div>
                            <span class="dt-period">SEM</span>
                        </div>
                        <div class="donut-item">
                            <div class="donut-wrap">
                                <DonutChart
                                    :size="80"
                                    :values="[m.coreCompleted, Math.max(0, m.coreRequiredYear - m.coreCompleted)]"/>
                                <div class="donut-text">
                                    <span class="dt-val">{{ m.coreCompleted }}</span>
                                    <span class="dt-max">/{{ m.coreRequiredYear }}</span>
                                </div>
                            </div>
                            <span class="dt-period">YEAR</span>
                        </div>
                    </div>
                </div>

                <div class="donut-divider"/>

                <div class="donut-row">
                    <span class="donut-label">ADV</span>
                    <div class="donut-pair">
                        <div class="donut-item">
                            <div class="donut-wrap">
                                <DonutChart
                                    :colors="['#60a5fa','#1e3a5a']"
                                    :size="80" :values="[m.advCompleted, Math.max(0, m.advRequiredSemester - m.advCompleted)]"/>
                                <div class="donut-text">
                                    <span class="dt-val" style="color:#60a5fa">{{ m.advCompleted }}</span>
                                    <span class="dt-max">/{{ m.advRequiredSemester }}</span>
                                </div>
                            </div>
                            <span class="dt-period">SEM</span>
                        </div>
                        <div class="donut-item">
                            <div class="donut-wrap">
                                <DonutChart :colors="['#60a5fa','#1e3a5a']"
                                            :size="80" :values="[m.advCompleted, Math.max(0, m.advRequiredYear - m.advCompleted)]"/>
                                <div class="donut-text">
                                    <span class="dt-val" style="color:#60a5fa">{{ m.advCompleted }}</span>
                                    <span class="dt-max">/{{ m.advRequiredYear }}</span>
                                </div>
                            </div>
                            <span class="dt-period">YEAR</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer stats -->
            <div class="card-footer">
                <div class="stat">
                    <span class="stat-val">{{ m.totalDone }}</span>
                    <span class="stat-label">completed</span>
                </div>
                <div class="stat">
                    <span class="stat-val">{{ m.tasks.length - m.totalDone }}</span>
                    <span class="stat-label">remaining</span>
                </div>
                <div class="stat">
                    <span class="stat-val">{{ Math.round((m.totalDone / m.tasks.length) * 100) }}%</span>
                    <span class="stat-label">progress</span>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.chart-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    align-items: start;
}

@media (max-width: 1000px) {
    .chart-grid {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 640px) {
    .chart-grid {
        grid-template-columns: 1fr;
    }
}

/* ── Card ───────────────────────────────────────────────── */
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

/* ── Top ────────────────────────────────────────────────── */
.card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
}

.card-name {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.grade-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.grade-block {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.grade-period {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.grade-value {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    font-family: var(--font-mono);
}

.grade-sep {
    width: 1px;
    height: 32px;
    background: var(--border-hi);
}

/* ── Donuts ─────────────────────────────────────────────── */
.donut-section {
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
}

.donut-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.donut-label {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text);
    width: 28px;
}

.donut-pair {
    display: flex;
    gap: 16px;
    flex: 1;
    justify-content: center;
}

.donut-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.donut-wrap {
    position: relative;
    width: 80px;
    height: 80px;
}

.donut-text {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    line-height: 1;
}

.dt-val {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 600;
    color: var(--accent);
}

.dt-max {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--muted);
}

.dt-period {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text);
    letter-spacing: 0.08em;
}

.donut-divider {
    height: 1px;
    background: var(--border);
    margin: 12px 0;
}

/* ── Footer ─────────────────────────────────────────────── */
.card-footer {
    display: flex;
    padding: 12px 18px;
    background: var(--faint);
}

.stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.stat-val {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
}

.stat-label {
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
</style>
