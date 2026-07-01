<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import apis from '@/services/apis'
import type { MessageVO } from '@/services/types'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { PermissionBit } from '@/services/types'

const props = defineProps<{ message: MessageVO; isMe?: boolean }>()
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

// ✅ 修复删除消息 - 直接操作 messageMap
async function deleteMsg() {
  const channelId = globalStore.currentChannelId
  if (!channelId) {
    ElMessage.error('无法获取频道信息')
    return
  }
  try {
    await apis.deleteMessage(channelId, props.message.id).send()
    
    // ✅ 直接从 messageMap 中删除
    const channelMap = chatStore.messageMap.get(channelId)
    if (channelMap) {
      const deleted = channelMap.delete(props.message.id)
      if (deleted) {
        ElMessage.success('消息已删除')
      } else {
        ElMessage.warning('消息已删除，请刷新页面查看')
      }
    } else {
      ElMessage.warning('消息已删除，请刷新页面查看')
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    ElMessage.error('删除消息失败')
  }
}

// ✅ 修复创建话题
async function createThread() {
  const channelId = globalStore.currentChannelId
  if (!channelId) {
    ElMessage.error('无法获取频道信息')
    return
  }
  try {
    const result = await apis.createThread(channelId, { rootMsgId: props.message.id }).send()
    ElMessage.success('话题已创建')
    
    // ✅ 使用 chatStore 的 setMessageThread 方法更新消息
    if (result?.thread) {
      chatStore.setMessageThread(props.message.id, result.thread)
    }
  } catch (error) {
    console.error('创建话题失败:', error)
    ElMessage.error('创建话题失败，请查看控制台错误')
  }
}

async function toggleReaction(emoji: string) {
  try {
    const data = await apis.addReaction(props.message.id, emoji).send()
    if (data) {
      const target = data.find((r: { emoji: string }) => r.emoji === emoji)
      if (target) {
        chatStore.updateReaction(props.message.id, target)
      } else {
        chatStore.removeReactionEmoji(props.message.id, emoji)
      }
    }
  } catch {
    /* ignore — WS 推送会同步 */
  }
}

const quickEmojis = ['👍','❤️','😂','🎉','🔥','👀']

// ── Mini emoji picker for reactions ──
const showReactionPicker = ref(false)

const reactionEmojis = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏',
  '😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶',
  '😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳',
  '🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱',
  '😤','😡','😠','🤬','👋','🤚','🖐️','👍','👎','👏','🙌','🤝','💪',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💞','💓','💗','💖','💘',
  '🔥','⭐','🌟','✨','💫','💯','✅','❌','🎉','🎊','🎈','🏆','💡','🚀',
  '💩','🤡','👻','👽','💀','☠️','🐵','🐶','🐱','🦊','🐻','🐼',
]

function toggleReactionPicker() {
  showReactionPicker.value = !showReactionPicker.value
}

function onPickReaction(emoji: string) {
  toggleReaction(emoji)
  showReactionPicker.value = false
}

const emit = defineEmits<{ edit: [msgId: number] }>()

function handleEdit() {
  emit('edit', props.message.id)
}
</script>

<template>
  <div :class="['context-menu', { 'is-me': isMe }]">
    <div class="emoji-row">
      <span
        v-for="e in quickEmojis"
        :key="e"
        class="menu-emoji"
        @click="toggleReaction(e)"
      >{{ e }}</span>
      <span class="menu-emoji picker-toggle" title="更多表情" @click="toggleReactionPicker">
        <span class="picker-toggle-icon">+</span>
      </span>
    </div>

    <div v-if="showReactionPicker" class="reaction-picker-popover">
      <div class="reaction-picker-grid">
        <span
          v-for="emoji in reactionEmojis"
          :key="emoji"
          class="reaction-picker-emoji"
          @click="onPickReaction(emoji)"
        >{{ emoji }}</span>
      </div>
    </div>

    <div class="menu-sep" />
    <div class="menu-item" @click="replyTo()">
      <span class="menu-icon">↩</span> 回复
    </div>
    <div v-if="isAuthor" class="menu-item" @click="handleEdit">
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

  &.is-me {
    right: auto;
    left: 16px;
  }
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

.picker-toggle {
  margin-left: 2px;
  border: 1px dashed var(--divider-color, rgba(255, 255, 255, 15%));
}

.picker-toggle-icon {
  font-size: 16px;
  font-weight: 300;
  color: var(--font-secondary);
}

.reaction-picker-popover {
  padding: 6px;
  margin-top: 2px;
  max-height: 180px;
  overflow-y: auto;
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
  border-radius: 6px;
}

.reaction-picker-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.reaction-picker-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 17px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.1s, transform 0.1s;

  &:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 8%));
    transform: scale(1.25);
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