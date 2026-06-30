<script setup lang="ts">
import { computed } from 'vue'
import { MsgEnum } from '@/enums'
import type { MessageVO } from '@/services/types'
import Image from './image.vue'
import Voice from './voice.vue'
import File from './file.vue'
import Text from './text.vue'
import Emoji from './emoji.vue'

const props = defineProps<{ message: MessageVO }>()
const cmp: Record<number, any> = {
  [MsgEnum.TEXT]: Text,
  [MsgEnum.SYSTEM]: Text,
  [MsgEnum.IMAGE]: Image,
  [MsgEnum.FILE]: File,
  [MsgEnum.SOUND]: Voice,
  [MsgEnum.EMOJI]: Emoji,
}
const comp = computed(() => cmp[props.message.msgType] || Text)
</script>
<template>
  <component :is="comp" :body="(message as any)" :data-message-id="message.id" />
</template>
