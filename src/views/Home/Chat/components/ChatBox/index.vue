<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { MessageType } from '@/services/types'
import { useUpload } from '@/hooks/useUpload'
import wsIns from '@/utils/websocket'
import MentionPicker from '../MentionPicker.vue'

const globalStore = useGlobalStore()
const chatStore = useChatStore()
const userStore = useUserStore()
const {
  isUploading,
  uploadFile,
  pendingFileId,
  onStart: onUploadStart,
  onChange: onUploadChange,
} = useUpload()
const inputText = ref('')
const showMention = ref(false)
const mentionSearch = ref('')
const replyMsg = computed(() => chatStore.currentMsgReply)
const isSign = computed(() => userStore.isSign)

// TYPING 防抖：输入时 sendTypingStart，2s 无输入 sendTypingStop
let typingTimer: ReturnType<typeof setTimeout> | null = null
function handleTyping() {
  if (!globalStore.currentChannelId) return
  wsIns.sendTypingStart(globalStore.currentChannelId)
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    if (globalStore.currentChannelId) wsIns.sendTypingStop(globalStore.currentChannelId)
  }, 2000)
}

onUploadStart(() => {
  /* upload started */
})
onUploadChange((status) => {
  if (status === 'success') {
    /* upload complete */
  }
})

async function sendText() {
  const text = inputText.value.trim()
  if (!text || !globalStore.currentChannelId) return
  // 发送前清除 typing 防抖
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }
  wsIns.sendTypingStop(globalStore.currentChannelId)
  const fileIds = pendingFileId.value ? [pendingFileId.value] : undefined
  await chatStore.sendMessage?.({
    channelId: globalStore.currentChannelId,
    content: text,
    msgType: MessageType.TEXT,
    replyMsgId: replyMsg.value?.id,
    threadId: globalStore.currentThreadId || undefined,
    fileIds,
  })
  inputText.value = ''
  chatStore.clearReply()
}

function onInputChange(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  inputText.value = val
  handleTyping()
  const idx = val.lastIndexOf('@')
  if (idx >= 0 && (idx === 0 || val[idx - 1] === ' ')) {
    mentionSearch.value = val.slice(idx + 1)
    showMention.value = true
  } else {
    showMention.value = false
  }
}
function onMentionSelect(nickname: string) {
  inputText.value = inputText.value.replace(/@\S*$/, `@${nickname} `)
  showMention.value = false
}
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadFile(file)
}
</script>
<template>
  <div class="chat-box">
    <div v-if="replyMsg?.id" class="reply-bar"
      >回复 {{ replyMsg.fromUser?.nickname }}
      <el-button size="small" text @click="chatStore.clearReply()">✕</el-button></div
    >
    <div class="input-row">
      <label class="file-btn" v-login-show title="上传文件">
        <el-icon :size="18"><IEpLink /></el-icon>
        <input type="file" hidden @change="onFileChange" />
      </label>
      <div class="input-wrapper">
        <textarea
          :value="inputText"
          class="msg-textarea"
          :placeholder="isSign ? '发送消息...' : '点此登录后发言~'"
          rows="1"
          v-login="() => {}"
          @input="onInputChange"
          @keydown.enter.exact.prevent="sendText()"
        />
        <MentionPicker v-if="showMention" :search="mentionSearch" @select="onMentionSelect" />
      </div>
      <el-button
        type="primary"
        size="small"
        :disabled="!inputText.trim() || isUploading"
        @click="sendText"
        >发送</el-button
      >
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-box {
  padding: 0 16px 16px;
}
.reply-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  background-color: var(--bg-hover);
  border-radius: 4px;
}
.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 8px 12px;
  background-color: var(--bg-input, rgba(255, 255, 255, 6%));
  border-radius: 8px;
}
.file-btn {
  padding: 4px;
  color: var(--font-secondary);
  cursor: pointer;
  &:hover {
    color: var(--font-main);
  }
}
.input-wrapper {
  position: relative;
  flex: 1;
}
.msg-textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  color: var(--font-main);
  resize: none;
  background: transparent;
  border: none;
  outline: none;
}
</style>
