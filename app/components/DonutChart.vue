<script lang="ts" setup>
import {Doughnut} from 'vue-chartjs'
import {Chart as ChartJS, ArcElement, Tooltip} from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps({
    values: {type: Array as () => number[], required: true},
    colors: {type: Array as () => string[], default: () => ['#f97316', '#1e1e1e']},
    size: {type: Number, default: 80},
    cutout: {type: String, default: '72%'},
})

const chartData = computed(() => ({
    datasets: [{
        data: props.values,
        backgroundColor: props.colors,
        borderWidth: 0,
        hoverOffset: 0,
    }],
}))

const chartOptions = computed(() => ({
    cutout: props.cutout,
    responsive: true,
    maintainAspectRatio: false,
    animation: {duration: 600, easing: 'easeOutQuart' as const},
    plugins: {legend: {display: false}, tooltip: {enabled: false}},
}))
</script>

<template>
    <div :style="{ width: `${size}px`, height: `${size}px` }">
        <Doughnut :data="chartData" :options="chartOptions"/>
    </div>
</template>
