<script lang="ts" setup>
const route = useRoute()

function exportData() {
    window.open('/api/export', '_blank')
}

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
        const json = JSON.parse(await file.text())
        await $fetch('/api/import', {method: 'POST', body: json})
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
                <button class="btn" @click="exportData">
                    <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
                        <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" stroke-linecap="round"
                              stroke-linejoin="round" stroke-width="1.5"/>
                    </svg>
                    Export
                </button>
                <button :disabled="importing" class="btn" @click="triggerImport">
                    <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
                        <path d="M6 11V4M3 7l3-3 3 3M1 2h10" stroke="currentColor" stroke-linecap="round"
                              stroke-linejoin="round" stroke-width="1.5"/>
                    </svg>
                    {{ importing ? 'Importing…' : 'Import' }}
                </button>
                <input ref="fileInput" accept=".json" style="display:none" type="file" @change="handleFileChange"/>
            </div>
        </nav>
        <div v-if="importError" class="import-error">{{ importError }}</div>
        <NuxtPage/>
    </main>
</template>
