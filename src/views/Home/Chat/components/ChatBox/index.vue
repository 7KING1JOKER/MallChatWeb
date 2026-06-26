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
  progress: uploadProgress,
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
const uploadingFileName = ref('')

onUploadStart(() => {
  /* started */
})
onUploadChange((status) => {
  if (status === 'success') {
    /* complete */
  }
})

// TYPING 防抖
let typingTimer: ReturnType<typeof setTimeout> | null = null

function handleTyping() {
  if (!globalStore.currentChannelId) return
  wsIns.sendTypingStart(globalStore.currentChannelId)
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    if (globalStore.currentChannelId) wsIns.sendTypingStop(globalStore.currentChannelId)
  }, 2000)
}

async function sendText() {
  const text = inputText.value.trim()
  if (!text || !globalStore.currentChannelId) return
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

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    uploadingFileName.value = file.name
    await uploadFile(file)
  }
}

// Enter 发送，Shift+Enter 换行
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendText()
  }
}
</script>

<template>
  <div class="chat-box">
    <!-- 回复提示条 -->
    <div v-if="replyMsg?.id" class="reply-bar">
      <span class="reply-label">
        ↩ 回复 <strong>{{ replyMsg.fromUser?.nickname }}</strong>
      </span>
      <span class="reply-preview">{{ replyMsg.content?.slice(0, 80) }}</span>
      <el-button size="small" text class="reply-close" @click="chatStore.clearReply()">✕</el-button>
    </div>

    <!-- 上传进度条 -->
    <div v-if="isUploading" class="upload-progress-bar">
      <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      <span class="upload-progress-text">{{ uploadingFileName }} — {{ uploadProgress }}%</span>
    </div>

    <!-- 输入区 -->
    <div class="input-row">
      <label class="file-btn" title="上传文件">
        <span class="file-btn-icon">+</span>
        <input type="file" hidden @change="onFileChange" />
      </label>
      <div class="input-wrapper">
        <textarea
          :value="inputText"
          class="msg-textarea"
          :placeholder="isSign ? '发送消息...' : '点此登录后发言~'"
          rows="1"
          @input="onInputChange"
          @keydown="onKeydown"
        />
        <MentionPicker v-if="showMention" :search="mentionSearch" @select="onMentionSelect" />
      </div>
      <el-button
        type="primary"
        size="small"
        :disabled="!inputText.trim() || isUploading"
        class="send-btn"
        @click="sendText"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-box {
  padding: 0 16px 20px;
}

.reply-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  background-color: var(--bg-hover, rgba(255, 255, 255, 5%));
  border-left: 3px solid var(--el-color-primary, #5865f2);
  border-radius: 0 6px 6px 0;
}

.reply-label {
  flex-shrink: 0;
  color: var(--font-secondary);

  strong {
    color: var(--font-main);
  }
}

.reply-preview {
  flex: 1;
  overflow: hidden;
  color: var(--font-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.7;
}

.reply-close {
  flex-shrink: 0;
}

.upload-progress-bar {
  position: relative;
  height: 22px;
  margin-bottom: 8px;
  overflow: hidden;
  background-color: var(--bg-hover, rgba(255, 255, 255, 5%));
  border-radius: 6px;
}

.upload-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary, #5865f2), var(--el-color-primary-light-3, #7b83f7));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.upload-progress-text {
  position: absolute;
  top: 50%;
  left: 12px;
  font-size: 11px;
  color: #fff;
  mix-blend-mode: difference;
  transform: translateY(-50%);
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 10px 14px;
  background-color: var(--bg-input, rgba(255, 255, 255, 5%));
  border-radius: 10px;
  transition: background-color 0.2s;

  &:focus-within {
    background-color: var(--bg-input-focus, rgba(255, 255, 255, 8%));
    outline: 1px solid var(--el-color-primary-light-5, rgba(88, 101, 242, 30%));
  }
}

.file-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--font-secondary, #949ba4);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.15s;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover, rgba(255, 255, 255, 10%));
  }
}

.file-btn-icon {
  font-size: 22px;
  font-weight: 300;
  line-height: 1;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.msg-textarea {
  width: 100%;
  padding: 4px 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--font-main);
  resize: none;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--font-secondary);
  }
}

.send-btn {
  flex-shrink: 0;
  border-radius: 8px;
}
</style>
