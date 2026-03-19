<script lang="ts" setup>
import {Doughnut} from 'vue-chartjs'
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from 'chart.js'
import {computed} from "vue"

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
    values: {type: Array as () => number[], required: true},
    colors: {type: Array as () => string[], default: () => ['#e46b09', '#2e2e2e']},
    labels: {type: Array as () => string[], default: () => []},
    size: {type: Number, default: 140},
    cutout: {type: String, default: '68%'},
})

const chartData = computed(() => ({
    labels: props.labels,
    datasets: [
        {
            data: props.values,
            backgroundColor: props.colors,
            borderWidth: 0,
            hoverOffset: 2,
        },
    ],
}))

const chartOptions = computed(() => ({
    cutout: props.cutout,
    responsive: true,
    maintainAspectRatio: false,
    animation: {duration: 700, easing: 'easeOutQuart' as const},
    plugins: {
        legend: {display: false},
        tooltip: {enabled: props.labels.length > 0},
    },
}))
</script>

<template>
    <div :style="{ width: `${size}px`, height: `${size}px` }" class="donut-wrap">
        <Doughnut :data="chartData" :options="chartOptions"/>
    </div>
</template>

<style scoped>
.donut-wrap {
    position: relative;
    flex-shrink: 0;
}
</style>
