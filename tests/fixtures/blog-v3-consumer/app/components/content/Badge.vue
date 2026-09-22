<script setup lang="ts">
defineProps<{ name?: string }>()
</script>

<template>
<span class="fixture-badge" data-fixture-component-override="badge"><slot /></span>
</template>
