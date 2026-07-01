<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { useUserStore } from '@/stores/user'
import { PermissionBit } from '@/services/types'
import type { ChannelVO, RoleVO, ChannelPermissionVO } from '@/services/types'
import apis from '@/services/apis'

const route = useRoute()
const serverStore = useServerStore()
const globalStore = useGlobalStore()
const userStore = useUserStore()

const serverId = computed(() => Number(route.params.serverId))

// 权限位标签
const PERMISSION_LABELS: Record<number, string> = {
  [PermissionBit.CREATE_INVITE]: '创建邀请',
  [PermissionBit.KICK_MEMBERS]: '踢出成员',
  [PermissionBit.BAN_MEMBERS]: '封禁成员',
  [PermissionBit.ADMINISTRATOR]: '管理员',
  [PermissionBit.MANAGE_CHANNELS]: '管理频道',
  [PermissionBit.MANAGE_SERVER]: '管理服务器',
  [PermissionBit.ADD_REACTIONS]: '添加反应',
  [PermissionBit.SEND_MESSAGES]: '发送消息',
  [PermissionBit.USE_THREADS]: '使用话题',
  [PermissionBit.EMBED_LINKS]: '嵌入链接',
  [PermissionBit.ATTACH_FILES]: '上传文件',
  [PermissionBit.MENTION_EVERYONE]: '@全体成员',
  [PermissionBit.MANAGE_ROLES]: '管理角色',
}

const PERMISSION_BITS = [
  PermissionBit.CREATE_INVITE,
  PermissionBit.KICK_MEMBERS,
  PermissionBit.BAN_MEMBERS,
  PermissionBit.ADMINISTRATOR,
  PermissionBit.MANAGE_CHANNELS,
  PermissionBit.MANAGE_SERVER,
  PermissionBit.ADD_REACTIONS,
  PermissionBit.SEND_MESSAGES,
  PermissionBit.USE_THREADS,
  PermissionBit.EMBED_LINKS,
  PermissionBit.ATTACH_FILES,
  PermissionBit.MENTION_EVERYONE,
  PermissionBit.MANAGE_ROLES,
]

// 获取所有频道
const allChannels = computed(() => {
  const cats = serverStore.currentDetail?.categories || []
  const channels: ChannelVO[] = []
  for (const cat of cats) {
    channels.push(...cat.channels)
  }
  return channels
})

const selectedChannelId = ref<number | null>(null)
const permissions = ref<ChannelPermissionVO[]>([])
const loading = ref(false)
const roles = ref<RoleVO[]>([])

// 弹窗
const showCreateModal = ref(false)
const createLoading = ref(false)
const createForm = ref({
  targetType: 0 as 0 | 1,
  targetId: null as number | null,
  allowBits: 0,
  denyBits: 0,
})

// 获取频道权限覆盖
async function loadPermissions(channelId: number) {
  loading.value = true
  try {
    const res = await apis.getChannelPermissions(channelId).send()
    permissions.value = res || []
  } catch {
    permissions.value = []
  } finally {
    loading.value = false
  }
}

// 加载角色列表
async function loadRoles() {
  try {
    const res = await apis.getRoles(serverId.value).send()
    roles.value = res || []
  } catch {
    roles.value = []
  }
}

// 选择频道
function selectChannel(channelId: number) {
  selectedChannelId.value = channelId
  loadPermissions(channelId)
}

// 获取目标名称
function getTargetName(perm: ChannelPermissionVO): string {
  if (perm.targetType === 0) {
    const role = roles.value.find(r => r.id === perm.targetId)
    return role ? `@${role.name}` : `角色 ${perm.targetId}`
  } else {
    const member = serverStore.members.find(m => m.userId === perm.targetId)
    return member ? member.nickname : `用户 ${perm.targetId}`
  }
}

// 获取目标类型标签
function getTargetTypeLabel(perm: ChannelPermissionVO): string {
  return perm.targetType === 0 ? '角色' : '用户'
}

// 解析权限位
function getPermissionLabels(bits: number): string[] {
  const labels: string[] = []
  for (const bit of PERMISSION_BITS) {
    if (bits & bit) {
      labels.push(PERMISSION_LABELS[bit] || `权限${bit}`)
    }
  }
  return labels
}

// 删除权限覆盖
async function deletePermission(perm: ChannelPermissionVO) {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${getTargetName(perm)} 的权限覆盖？`,
      '删除权限覆盖',
      { type: 'warning' }
    )
    await apis.deleteChannelPermission(selectedChannelId.value!, perm.id).send()
    permissions.value = permissions.value.filter(p => p.id !== perm.id)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

// 打开新增弹窗
function openCreateModal() {
  createForm.value = {
    targetType: 0,
    targetId: null,
    allowBits: 0,
    denyBits: 0,
  }
  showCreateModal.value = true
}

// 提交新增
async function submitCreate() {
  if (!createForm.value.targetId || !selectedChannelId.value) {
    ElMessage.warning('请选择目标')
    return
  }
  if (createForm.value.allowBits === 0 && createForm.value.denyBits === 0) {
    ElMessage.warning('请至少设置一个允许或拒绝权限')
    return
  }

  createLoading.value = true
  try {
    const params = {
      targetType: createForm.value.targetType,
      targetId: createForm.value.targetId,
      allowBits: createForm.value.allowBits,
      denyBits: createForm.value.denyBits,
    }
    console.log('📤 发送权限覆盖请求:', params)
    
    await apis.setChannelPermission(selectedChannelId.value, params).send()
    
    ElMessage.success('权限覆盖已添加')
    showCreateModal.value = false
    await loadPermissions(selectedChannelId.value)
  } catch (error: any) {
    console.error('❌ 添加权限覆盖失败:', error)
    const errData = error?.data || error?.response?.data
    const errMsg = errData?.message || error?.message || '添加失败'
    ElMessage.error(errMsg)
  } finally {
    createLoading.value = false
  }
}

// 切换权限位
function toggleAllowBit(bit: number) {
  createForm.value.allowBits ^= bit
}

function toggleDenyBit(bit: number) {
  createForm.value.denyBits ^= bit
}

function isAllowSelected(bit: number): boolean {
  return !!(createForm.value.allowBits & bit)
}

function isDenySelected(bit: number): boolean {
  return !!(createForm.value.denyBits & bit)
}

// 可用目标列表
const availableTargets = computed(() => {
  if (createForm.value.targetType === 0) {
    return roles.value
      .filter(r => r.name !== '@everyone')
      .map(r => ({ id: r.id, name: r.name }))
  } else {
    return serverStore.members.map(m => ({ id: m.userId, name: m.nickname }))
  }
})

// 加载服务器详情
async function loadServerDetail() {
  if (!serverStore.currentDetail) {
    await serverStore.getServerDetail(serverId.value)
  }
}

onMounted(async () => {
  await loadServerDetail()
  await loadRoles()
  if (allChannels.value.length > 0) {
    selectChannel(allChannels.value[0].id)
  }
})

watch(() => serverStore.currentDetail, () => {
  if (allChannels.value.length > 0 && !selectedChannelId.value) {
    selectChannel(allChannels.value[0].id)
  }
}, { immediate: true })
</script>

<template>
  <div class="settings-permissions">
    <div class="permissions-layout">
      <!-- 左侧：频道列表 -->
      <div class="channel-sidebar">
        <h4>频道列表</h4>
        <div class="channel-list">
          <div
            v-for="ch in allChannels"
            :key="ch.id"
            :class="['channel-item', { active: selectedChannelId === ch.id }]"
            @click="selectChannel(ch.id)"
          >
            <span class="channel-icon">#</span>
            <span class="channel-name">{{ ch.name }}</span>
          </div>
          <div v-if="!allChannels.length" class="empty-hint">暂无频道</div>
        </div>
      </div>

      <!-- 右侧：权限覆盖列表 -->
      <div class="permission-content">
        <div class="content-header">
          <h4>权限覆盖</h4>
          <el-button
            size="small"
            type="primary"
            :disabled="!selectedChannelId"
            @click="openCreateModal"
          >
            + 新增权限覆盖
          </el-button>
        </div>

        <div v-if="loading" class="loading">加载中...</div>

        <div v-else-if="permissions.length === 0" class="empty-state">
          暂无权限覆盖，点击「新增权限覆盖」添加
        </div>

        <div v-else class="permission-list">
          <div v-for="perm in permissions" :key="perm.id" class="permission-item">
            <div class="perm-info">
              <span class="perm-target">
                <span class="target-type">{{ getTargetTypeLabel(perm) }}</span>
                {{ getTargetName(perm) }}
              </span>
              <div class="perm-bits">
                <div v-if="perm.allowBits" class="perm-bits-group allow">
                  <span class="bits-label">✅ 允许：</span>
                  <span class="bits-tags">
                    <span v-for="label in getPermissionLabels(perm.allowBits)" :key="label" class="tag allow">
                      {{ label }}
                    </span>
                  </span>
                </div>
                <div v-if="perm.denyBits" class="perm-bits-group deny">
                  <span class="bits-label">❌ 拒绝：</span>
                  <span class="bits-tags">
                    <span v-for="label in getPermissionLabels(perm.denyBits)" :key="label" class="tag deny">
                      {{ label }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div class="perm-actions">
              <el-button size="small" type="danger" @click="deletePermission(perm)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增权限覆盖弹窗 -->
    <el-dialog
      v-model="showCreateModal"
      title="新增权限覆盖"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="目标类型">
          <el-radio-group v-model="createForm.targetType">
            <el-radio :value="0">角色</el-radio>
            <el-radio :value="1">用户</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="选择目标">
          <el-select
            v-model="createForm.targetId"
            placeholder="请选择"
            style="width: 100%;"
          >
            <el-option
              v-for="item in availableTargets"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="允许权限">
          <div class="perm-checkbox-group">
            <el-checkbox
              v-for="bit in PERMISSION_BITS"
              :key="bit"
              :model-value="isAllowSelected(bit)"
              @change="toggleAllowBit(bit)"
            >
              {{ PERMISSION_LABELS[bit] }}
            </el-checkbox>
          </div>
        </el-form-item>

        <el-form-item label="拒绝权限">
          <div class="perm-checkbox-group">
            <el-checkbox
              v-for="bit in PERMISSION_BITS"
              :key="bit"
              :model-value="isDenySelected(bit)"
              @change="toggleDenyBit(bit)"
            >
              {{ PERMISSION_LABELS[bit] }}
            </el-checkbox>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.settings-permissions {
  height: 100%;
  padding: 16px 20px;
}

.permissions-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.channel-sidebar {
  width: 200px;
  min-width: 200px;
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border-radius: 8px;

  h4 {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--font-secondary);
  }
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  font-size: 14px;
  color: var(--font-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    color: var(--font-main);
    background: var(--bg-hover);
  }

  &.active {
    color: var(--font-main);
    background: rgba(88, 101, 242, 15%);
  }
}

.channel-icon {
  opacity: 0.7;
}

.permission-content {
  flex: 1;
  min-width: 0;
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 3%));
  border-radius: 8px;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h4 {
    margin: 0;
    font-size: 13px;
    color: var(--font-secondary);
  }
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--font-secondary);
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--font-secondary);
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-hover, rgba(255, 255, 255, 3%));
  border-radius: 6px;

  &:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 6%));
  }
}

.perm-info {
  flex: 1;
  min-width: 0;
}

.perm-target {
  font-size: 14px;
  font-weight: 500;

  .target-type {
    padding: 1px 6px;
    margin-right: 6px;
    font-size: 11px;
    font-weight: 400;
    color: var(--font-secondary);
    background: rgba(255, 255, 255, 6%);
    border-radius: 3px;
  }
}

.perm-bits {
  margin-top: 4px;
}

.perm-bits-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 12px;

  .bits-label {
    color: var(--font-secondary);
  }
}

.bits-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 0 6px;
  font-size: 11px;
  border-radius: 3px;

  &.allow {
    color: #67c23a;
    background: rgba(103, 194, 58, 0.15);
  }

  &.deny {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.15);
  }
}

.perm-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.permission-item:hover .perm-actions {
  opacity: 1;
}

.perm-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-hint {
  padding: 20px;
  font-size: 13px;
  color: var(--font-secondary);
  text-align: center;
}
</style>