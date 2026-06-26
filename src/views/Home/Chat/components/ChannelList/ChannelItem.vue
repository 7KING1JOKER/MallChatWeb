<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelVO } from '@/services/types'
import { ChannelType } from '@/services/types'
const props = defineProps<{ channel: ChannelVO; unreadCount?: number; isActive?: boolean }>()
const emit = defineEmits<{ click: [channelId: number] }>()
const isVoice = computed(() => props.channel.type === ChannelType.VOICE)
const badge = computed(() =>
  props.unreadCount ? (props.unreadCount > 99 ? 99 : props.unreadCount) : 0,
)
</script>
<template>
  <div
    :class="['channel-card', { active: isActive, voice: isVoice }]"
    @click="emit('click', channel.id)"
  >
    <div class="card-left">
      <span class="channel-icon">{{ isVoice ? '🔊' : '#' }}</span>
    </div>
    <div class="card-body">
      <span class="channel-name">{{ channel.name }}</span>
      <span v-if="channel.topic" class="channel-topic">{{ channel.topic }}</span>
    </div>
    <el-badge v-if="badge" :value="badge" :max="99" class="unread-badge" />
  </div>
</template>
<style lang="scss" scoped>
.channel-card {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--font-secondary, #949ba4);
  cursor: pointer;
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    color: var(--font-main);
    background: var(--bg-hover, rgba(255, 255, 255, 6%));
    border-color: var(--border-hover, rgba(255, 255, 255, 8%));
  }

  &.active {
    color: var(--font-main, #fff);
    background: var(--bg-active, rgba(88, 101, 242, 15%));
    border-color: var(--el-color-primary, #5865f2);
    .channel-icon {
      color: var(--el-color-primary, #5865f2);
    }
  }
}

.card-left {
  flex-shrink: 0;
}
.channel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 18px;
  background: rgba(0, 0, 0, 20%);
  border-radius: 6px;
  transition: color 0.15s;
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.channel-name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.channel-topic {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.6;
}

.unread-badge {
  flex-shrink: 0;
}
</style>
