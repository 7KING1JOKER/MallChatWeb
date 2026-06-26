<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import UserSettingBox from '@/components/UserSettingBox/index.vue'
const userStore = useUserStore()
const settingVisible = ref(false)
const user = computed(() => userStore.userInfo)
</script>
<template>
  <div class="user-panel">
    <div class="user-info" v-login="() => (settingVisible = true)">
      <el-avatar :size="32" :src="user.avatar" />
      <span class="nickname">{{ user.nickname || '未登录' }}</span>
    </div>
    <UserSettingBox v-model="settingVisible" />
  </div>
</template>
<style lang="scss" scoped>
.user-panel {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--bg-dark, rgba(0, 0, 0, 20%));
}

.user-info {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}

.nickname {
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
