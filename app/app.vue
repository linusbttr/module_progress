<script lang="ts" setup>
import {ref} from "vue"
import {useRoute} from "vue-router"

const route = useRoute()

// ── Export ──────────────────────────────────────────────────────────────────
function exportData() {
    window.open('/api/export', '_blank')
}

// ── Import ──────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importError = ref<string | null>(null)

function triggerImport() {
    importError.value = null
    fileInput.value?.click()
}

async function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    importing.value = true
    importError.value = null

    try {
        const text = await file.text()
        const json = JSON.parse(text)
        await $fetch('/api/import', {method: 'POST', body: json})
        // Reload the page to reflect the imported data
        window.location.reload()
    } catch (err: any) {
        importError.value = err?.data?.message ?? err?.message ?? 'Import failed'
    } finally {
        importing.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}
</script>

<template>
    <main>
        <nav>
            <h1>Module Progress</h1>

            <div class="links">
                <NuxtLink :class="{ active: route.path === '/' }" to="/">List</NuxtLink>
                <NuxtLink :class="{ active: route.path === '/chart' }" to="/chart">Chart</NuxtLink>
            </div>

            <div class="actions">
                <button :disabled="importing" class="btn-action" @click="exportData">
                    <span>↑ Export</span>
                </button>
                <button :disabled="importing" class="btn-action" @click="triggerImport">
                    <span>{{ importing ? 'Importing…' : '↓ Import' }}</span>
                </button>
                <input ref="fileInput" accept=".json" style="display:none" type="file" @change="handleFileChange"/>
            </div>
        </nav>

        <div v-if="importError" class="import-error">
            {{ importError }}
        </div>

        <NuxtPage/>
    </main>
</template>

<style scoped>
.actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.btn-action {
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #3c3c3c;
    background: #2b2b2b;
    color: #e6e6e6;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s, border-color 0.2s;
}

.btn-action:hover:not(:disabled) {
    background: #3c3c3c;
    border-color: #e46b09;
}

.btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.import-error {
    background: #3a1a1a;
    border: 1px solid #7a2020;
    color: #ff7070;
    padding: 8px 14px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 13px;
}
</style>
