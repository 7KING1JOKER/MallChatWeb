<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelVO } from '@/services/types'
import { ChannelType } from '@/services/types'
const props = defineProps<{ channel: ChannelVO; unreadCount?: number; isActive?: boolean }>()
const emit = defineEmits<{ click: [channelId: number] }>()
const isVoice = computed(() => props.channel.type === ChannelType.VOICE)
const badge = computed(() => props.unreadCount ? (props.unreadCount > 99 ? 99 : props.unreadCount) : 0)
</script>
<template>
  <div :class="['channel-item', { active: isActive }]" @click="emit('click', channel.id)">
    <span class="channel-icon">{{ isVoice ? '🔊' : '#' }}</span>
    <span class="channel-name">{{ channel.name }}</span>
    <el-badge v-if="badge" :value="badge" :max="99" />
  </div>
</template>
<style lang="scss" scoped>
.channel-item { display:flex;align-items:center;gap:6px;padding:6px 12px;margin:0 8px;border-radius:4px;cursor:pointer;font-size:14px;color:var(--font-secondary,#949ba4);&:hover,&.active{color:var(--font-main);background-color:var(--bg-hover,rgba(255,255,255,.05))} }
.channel-icon { font-size:18px;width:24px;text-align:center }
.channel-name { flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
</style>
