<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useChatStore } from '@/stores/chat'
import MsgItem from './MsgItem/index.vue'
import { computedTimeBlock } from '@/utils/computedTime'

const globalStore = useGlobalStore()
const chatStore = useChatStore()
const listRef = ref<HTMLDivElement>()
const isNearBottom = ref(true)
const channelId = computed(() => globalStore.currentChannelId!)

const messages = computed(() => computedTimeBlock(chatStore.getMessages(channelId.value)))
const pageState = computed(() => chatStore.messageOptions.get(channelId.value))

function scrollToBottom(smooth = false) {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTo({
        top: listRef.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      })
    }
  })
}

watch(channelId, (cid) => {
  if (cid) chatStore.getChannelMessages(cid).then(() => scrollToBottom())
}, { immediate: true })

function onScroll() {
  const el = listRef.value
  if (!el || !pageState.value) return
  // 检测是否接近底部
  isNearBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
  // 顶部加载更多
  if (el.scrollTop <= 50 && !pageState.value.isLast && !pageState.value.isLoading) {
    chatStore.getChannelMessages(channelId.value)
  }
}

// 新消息到达时若在底部则自动滚动
const msgCount = computed(() => chatStore.getMessages(channelId.value).length)
watch(msgCount, () => {
  if (isNearBottom.value) scrollToBottom(true)
})
</script>

<template>
  <div class="chat-list" ref="listRef" @scroll="onScroll">
    <div v-if="pageState?.isLast" class="end-hint">—— 已是最早消息 ——</div>
    <MsgItem v-for="msg in messages" :key="msg.id" :message="msg" />
    <div v-if="!isNearBottom" class="scroll-bottom-btn" @click="scrollToBottom(true)">
      ↓ 新消息
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-list {
  position: relative;
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.end-hint {
  padding: 8px;
  font-size: 12px;
  color: var(--font-secondary, #949ba4);
  text-align: center;
}

.scroll-bottom-btn {
  position: sticky;
  bottom: 12px;
  left: 50%;
  z-index: 10;
  display: inline-block;
  padding: 6px 16px;
  margin: 0 auto;
  font-size: 13px;
  color: #fff;
  text-align: center;
  cursor: pointer;
  background-color: var(--el-color-primary, #5865f2);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 30%);
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
