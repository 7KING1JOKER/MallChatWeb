<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useChatStore } from '@/stores/chat'
import MsgItem from './MsgItem/index.vue'
import { computedTimeBlock } from '@/utils/computedTime'

const globalStore = useGlobalStore()
const chatStore = useChatStore()
const listRef = ref<HTMLDivElement>()
const channelId = computed(() => globalStore.currentChannelId!)

const messages = computed(() => computedTimeBlock(chatStore.getMessages(channelId.value)))
const pageState = computed(() => chatStore.messageOptions.get(channelId.value))

function scrollToBottom() { nextTick(() => { if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight }) }

watch(channelId, (cid) => { if (cid) chatStore.getChannelMessages(cid).then(scrollToBottom) }, { immediate: true })

function onScroll() {
  const el = listRef.value; if (!el || !pageState.value) return
  if (el.scrollTop <= 50 && !pageState.value.isLast && !pageState.value.isLoading) chatStore.getChannelMessages(channelId.value)
}
</script>
<template>
  <div class="chat-list" ref="listRef" @scroll="onScroll">
    <div v-if="pageState?.isLast" class="end-hint">—— 已是最早消息 ——</div>
    <MsgItem v-for="msg in messages" :key="msg.id" :message="msg" />
  </div>
</template>
<style lang="scss" scoped>
.chat-list { flex:1;overflow-y:auto;padding:16px 0 }
.end-hint { text-align:center;font-size:12px;color:var(--font-secondary);padding:8px }
</style>
