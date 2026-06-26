<script setup lang="ts">
import { computed } from 'vue'
import apis from '@/services/apis'
import type { MessageVO } from '@/services/types'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { PermissionBit } from '@/services/types'

const props = defineProps<{ message: MessageVO }>()
const userStore = useUserStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const globalStore = useGlobalStore()

const isAuthor = computed(() => props.message.fromUser.id === userStore.userInfo.id)
const canManage = computed(
  () =>
    serverStore.hasPermission(PermissionBit.ADMINISTRATOR) ||
    serverStore.hasPermission(PermissionBit.MANAGE_CHANNELS),
)

function replyTo() {
  chatStore.setReply(props.message)
}

async function deleteMsg() {
  try {
    await apis.deleteMessage(props.message.channelId, props.message.id).send()
    chatStore.deleteMessage(props.message.id)
  } catch {
    /* ignore */
  }
}

async function createThread() {
  if (!globalStore.currentChannelId) return
  try {
    await apis.createThread(globalStore.currentChannelId, { rootMsgId: props.message.id }).send()
  } catch {
    /* ignore */
  }
}

async function toggleReaction(emoji: string) {
  try {
    await apis.addReaction(props.message.id, emoji).send()
  } catch {
    await apis.removeReaction(props.message.id, emoji).send()
  }
}

const emojis = ['👍', '❤️', '😂', '🎉', '🔥', '👀']

const emit = defineEmits<{ edit: [msgId: number] }>()
</script>

<template>
  <div class="context-menu">
    <div class="emoji-row">
      <span
        v-for="e in emojis"
        :key="e"
        class="menu-emoji"
        @click="toggleReaction(e)"
      >{{ e }}</span>
    </div>
    <div class="menu-sep" />
    <div class="menu-item" @click="replyTo()">
      <span class="menu-icon">↩</span> 回复
    </div>
    <div v-if="isAuthor" class="menu-item" @click="$emit('edit', message.id)">
      <span class="menu-icon">✏️</span> 编辑
    </div>
    <div v-if="isAuthor || canManage" class="menu-item danger" @click="deleteMsg()">
      <span class="menu-icon">🗑</span> 删除
    </div>
    <div class="menu-item" @click="createThread()">
      <span class="menu-icon">🧵</span> 创建话题
    </div>
  </div>
</template>

<style lang="scss" scoped>
.context-menu {
  position: absolute;
  top: -8px;
  right: 16px;
  z-index: 100;
  display: none;
  min-width: 160px;
  padding: 4px;
  background-color: var(--background-wrapper, #1e1f22);
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 8%));
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 40%);
}

.msg-item:hover .context-menu {
  display: flex;
  flex-direction: column;
}

.emoji-row {
  display: flex;
  gap: 2px;
  padding: 4px;
}

.menu-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s, transform 0.15s;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 8%));
    transform: scale(1.2);
  }
}

.menu-sep {
  height: 1px;
  margin: 4px 8px;
  background: var(--divider-color, rgba(255, 255, 255, 8%));
}

.menu-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.12s;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 8%));
  }

  &.danger {
    color: var(--el-color-danger, #f56c6c);

    &:hover {
      background-color: rgba(245, 108, 108, 12%);
    }
  }
}

.menu-icon {
  width: 18px;
  text-align: center;
}
</style>
