<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { MessageVO } from '@/services/types'
import { useUserStore } from '@/stores/user'
import { useUserInfo } from '@/hooks/useCached'
import { useChatStore } from '@/stores/chat'
import { useGlobalStore } from '@/stores/global'
import { useServerStore } from '@/stores/server'
import { formatTimestamp } from '@/utils/computedTime'
import renderReplyContent from '@/utils/renderReplyContent'
import apis from '@/services/apis'
import ContextMenu from '../ContextMenu/index.vue'
import RenderMessage from '@/components/RenderMessage/index.vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{ message: MessageVO }>()
const userStore = useUserStore()
const chatStore = useChatStore()
const globalStore = useGlobalStore()
const serverStore = useServerStore()

const sender = useUserInfo(props.message.fromUser.id)
const isMe = computed(() => props.message.fromUser.id === userStore.userInfo.id)
const isEdited = computed(() => props.message.status === 2)
const time = computed(() =>
  props.message.createTime ? formatTimestamp(new Date(props.message.createTime).getTime()) : '',
)

// 从 localStorage 读取服务器昵称
function getCachedNickname(serverId: number, userId: number): string {
  try {
    const key = `server_nickname_${serverId}_${userId}`
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

// 响应式昵称，用于触发更新
const displayName = ref('')

// 更新显示昵称
function updateDisplayName() {
  const userId = props.message.fromUser.id
  const serverId = globalStore.currentServerId
  
  // 1. 先从 serverStore.members 中查找
  const member = serverStore.members.find(m => m.userId === userId)
  if (member?.serverNickname) {
    displayName.value = member.serverNickname
    return
  }
  
  // 2. 从 localStorage 缓存中读取
  if (serverId) {
    const cached = getCachedNickname(serverId, userId)
    if (cached) {
      displayName.value = cached
      return
    }
  }
  
  // 3. 使用全局昵称
  displayName.value = sender.nickname || props.message.fromUser.nickname
}

// 监听 store 变化
watch(
  () => serverStore.members,
  () => {
    updateDisplayName()
  },
  { deep: true }
)

// 监听 message 变化
watch(
  () => props.message,
  () => {
    updateDisplayName()
  },
  { immediate: true }
)

// 定时刷新昵称（每3秒检查一次缓存变化）
let timer: any = null
onMounted(() => {
  updateDisplayName()
  timer = setInterval(() => {
    updateDisplayName()
  }, 3000)
})

// 清理定时器
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const replyMsg = computed(() =>
  props.message.replyMsgId && globalStore.currentChannelId
    ? chatStore
        .getMessages(globalStore.currentChannelId)
        .find((m) => m.id === props.message.replyMsgId)
    : null,
)
const replyContent = computed(() =>
  replyMsg.value
    ? renderReplyContent(
        replyMsg.value.fromUser.nickname,
        replyMsg.value.msgType,
        replyMsg.value.content,
      )
    : null,
)

// ── Edit message ──
const editing = ref(false)
const editContent = ref('')

function handleEdit(msgId: number) {
  editContent.value = props.message.content || ''
  editing.value = true  // ✅ 设置为 true，ContextMenu 会隐藏
}

async function saveEdit() {
  if (!editContent.value.trim() || !globalStore.currentChannelId) return
  try {
    await apis.editMessage(globalStore.currentChannelId, props.message.id, { content: editContent.value }).send()
    chatStore.editMessage(props.message.id, editContent.value)
    editing.value = false  // ✅ 保存后关闭编辑模式
    ElMessage.success('消息已编辑')
  } catch {
    ElMessage.error('编辑失败')
  }
}

function cancelEdit() {
  editing.value = false  // ✅ 取消后关闭编辑模式
  editContent.value = ''
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
</script>

<template>
  <div :class="['msg-item', { 'is-me': isMe }]">
    <div v-if="(message as any).timeBlock" class="time-block">{{ (message as any).timeBlock }}</div>
    <div class="msg-content">
      <el-avatar :size="36" :src="sender.avatar" class="msg-avatar" />
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-nickname">{{ displayName }}</span>
          <span class="msg-time">{{ time }}</span>
          <span v-if="isEdited" class="edited-tag">(已编辑)</span>
        </div>
        <div v-if="replyContent" class="reply-ref">{{ replyContent }}</div>
        <RenderMessage v-if="!editing" :message="message" />
        <div v-else class="edit-area">
          <textarea
            v-model="editContent"
            class="edit-textarea"
            rows="2"
            @keydown.enter.exact.prevent="saveEdit"
            @keydown.escape="cancelEdit"
          />
          <div class="edit-actions">
            <span class="edit-hint">Esc 取消 · Enter 保存</span>
            <el-button size="small" text @click="cancelEdit">取消</el-button>
            <el-button size="small" type="primary" @click="saveEdit">保存</el-button>
          </div>
        </div>
        <div v-if="message.reactions?.length" class="reaction-row">
          <span
            v-for="r in message.reactions"
            :key="r.emoji"
            :class="['reaction-chip', { reacted: r.reacted }]"
            @click="toggleReaction(r.emoji)"
            >{{ r.emoji }} {{ r.count }}</span
          >
        </div>
        <div
          v-if="message.thread"
          class="thread-entry"
          @click="globalStore.enterThread(message.thread.id)"
          >🧵 {{ message.thread.name || '话题' }} · {{ message.thread.messageCount }} 条回复</div
        >
      </div>
    </div>
    <!-- ✅ 编辑时隐藏 ContextMenu -->
    <ContextMenu v-if="!editing" :message="message" :is-me="isMe" @edit="handleEdit" />
  </div>
</template>

<style lang="scss" scoped>
.msg-item {
  padding: 2px 16px;
  position: relative;

  &:hover {
    background-color: var(--bg-hover, rgba(255, 255, 255, 2%));
  }

  &.is-me {
    .msg-content {
      flex-direction: row-reverse;
    }

    .msg-body {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .msg-header {
      flex-direction: row-reverse;
    }

    .msg-avatar {
      margin-left: 0;
    }
  }
}

.time-block {
  margin: 12px 0;
  font-size: 12px;
  color: var(--font-secondary);
  text-align: center;
}

.msg-content {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.msg-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-header {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 2px;
}

.msg-nickname {
  font-size: 14px;
  font-weight: 500;
}

.msg-time {
  font-size: 11px;
  color: var(--font-secondary);
}

.edited-tag {
  font-size: 10px;
  color: var(--font-secondary);
}

.reply-ref {
  padding-left: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--font-secondary);
  border-left: 2px solid var(--font-secondary);
}

.reaction-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.reaction-chip {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 2px 8px;
  font-size: 13px;
  cursor: pointer;
  background-color: var(--bg-hover);
  border-radius: 8px;

  &:hover {
    border: 1px solid var(--el-color-primary);
  }

  &.reacted {
    background-color: var(--el-color-primary-light);
    border: 1px solid var(--el-color-primary);
  }
}

.thread-entry {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.edit-area {
  margin: 4px 0;
}

.edit-textarea {
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--font-main);
  resize: vertical;
  background: var(--bg-input, rgba(255, 255, 255, 5%));
  border: 1px solid var(--el-color-primary);
  border-radius: 6px;
  outline: none;

  &::placeholder {
    color: var(--font-secondary);
  }
}

.edit-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 4px;
}

.edit-hint {
  font-size: 11px;
  color: var(--font-secondary);
  margin-right: auto;
}
</style>