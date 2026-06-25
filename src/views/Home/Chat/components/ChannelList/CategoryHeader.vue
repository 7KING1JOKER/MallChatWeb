<script setup lang="ts">
import { ref } from 'vue'
import type { CategoryVO } from '@/services/types'
defineProps<{ category: CategoryVO }>()
const collapsed = ref(false)
</script>
<template>
  <div class="category-header" @click="collapsed = !collapsed">
    <el-icon :class="['arrow', { rotated: collapsed }]"><IEpArrowRight /></el-icon>
    <span class="category-name">{{ category.name }}</span>
  </div>
</template>
<style lang="scss" scoped>
.category-header { display:flex;align-items:center;gap:4px;padding:8px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--font-secondary,#949ba4);cursor:pointer;user-select:none;&:hover{color:var(--font-main)} }
.arrow { font-size:10px;transition:transform .2s;&.rotated{transform:rotate(90deg)} }
.category-name { flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
</style>
