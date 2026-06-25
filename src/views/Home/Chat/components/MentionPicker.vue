<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore } from '@/stores/server'
const props = defineProps<{ search: string }>()
const emit = defineEmits<{ select: [nickname: string] }>()
const serverStore = useServerStore()
const filtered = computed(() => { const s = props.search.toLowerCase(); return serverStore.members.filter(m => m.nickname.toLowerCase().includes(s)) })
</script>
<template>
  <div class="mention-picker">
    <div v-for="m in filtered" :key="m.userId" class="mention-item" @click="emit('select', m.nickname)"><el-avatar :size="24" :src="m.avatar" /><span>{{ m.nickname }}</span></div>
    <div v-if="!filtered.length" class="no-result">无匹配成员</div>
  </div>
</template>
<style lang="scss" scoped>
.mention-picker { position:absolute;bottom:100%;left:0;width:240px;max-height:200px;overflow-y:auto;background-color:var(--background-wrapper);border:1px solid var(--divider-color);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3) }
.mention-item { display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;&:hover{background-color:var(--bg-hover)} }
.no-result { padding:12px;text-align:center;font-size:13px;color:var(--font-secondary) }
</style>
