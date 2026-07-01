<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsOverview from './SettingsOverview.vue'
import SettingsRoles from './SettingsRoles.vue'
import SettingsEmoji from './SettingsEmoji.vue'
import SettingsInvites from './SettingsInvites.vue'
import SettingsPermissions from './SettingsPermissions.vue'

const route = useRoute()
const router = useRouter()
const tab = ref<'overview' | 'roles' | 'emoji' | 'invites' | 'permissions'>('overview')

const serverId = computed(() => route.params.serverId as string)

const tabs = [
  { key: 'overview' as const, label: '概览', icon: '⚙️' },
  { key: 'roles' as const, label: '角色', icon: '🔐' },
  { key: 'emoji' as const, label: '表情', icon: '😀' },
  { key: 'invites' as const, label: '邀请', icon: '🔗' },
  { key: 'permissions' as const, label: '频道权限', icon: '🔒' },
]

function goBackToServer() {
  router.push(`/servers/${serverId.value}/channels/`)
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-sidebar">
      <div class="back-btn" @click="goBackToServer">
        <span class="back-icon">←</span>
        <span>返回服务器</span>
      </div>
      <div class="sidebar-divider" />
      <div
        v-for="t in tabs"
        :key="t.key"
        :class="['tab-item', { active: tab === t.key }]"
        @click="tab = t.key"
      >
        <span class="tab-icon">{{ t.icon }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </div>
    </div>
    <div class="settings-content">
      <SettingsOverview v-if="tab === 'overview'" />
      <SettingsRoles v-else-if="tab === 'roles'" />
      <SettingsEmoji v-else-if="tab === 'emoji'" />
      <SettingsInvites v-else-if="tab === 'invites'" />
      <SettingsPermissions v-else />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.settings-sidebar {
  display: flex;
  flex-direction: column;
  width: 180px;
  min-width: 180px;
  padding: 16px 8px;
  background-color: var(--background-secondary, #2b2d31);
  border-right: 1px solid var(--divider-color, rgba(255, 255, 255, 6%));
}

.back-btn {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  margin-bottom: 4px;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover);
  }
}

.back-icon {
  font-size: 14px;
}

.sidebar-divider {
  height: 1px;
  margin: 8px 4px;
  background: var(--divider-color, rgba(255, 255, 255, 8%));
}

.tab-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--font-secondary, #949ba4);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    color: var(--font-main);
    background-color: var(--bg-hover);
  }

  &.active {
    font-weight: 600;
    color: var(--font-main);
    background-color: var(--bg-active, rgba(88, 101, 242, 12%));
  }
}

.tab-icon {
  font-size: 16px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
}
</style>