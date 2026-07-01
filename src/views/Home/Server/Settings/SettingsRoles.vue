<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useServerStore } from '@/stores/server'
import { useGlobalStore } from '@/stores/global'
import { PermissionBit } from '@/services/types'
import type { RoleVO } from '@/services/types'
import apis from '@/services/apis'

const route = useRoute()
const serverStore = useServerStore()
const globalStore = useGlobalStore()

const serverId = computed(() => Number(route.params.serverId))

// ✅ 先定义 PERM_LABEL_MAP（修复 TDZ 问题）
const PERM_LABEL_MAP: Record<string, string> = {
  CREATE_INVITE: '创建邀请',
  KICK_MEMBERS: '踢出成员',
  BAN_MEMBERS: '封禁成员',
  ADMINISTRATOR: '管理员（全部权限）',
  MANAGE_CHANNELS: '管理频道',
  MANAGE_SERVER: '管理服务器',
  ADD_REACTIONS: '添加反应',
  SEND_MESSAGES: '发送消息',
  USE_THREADS: '使用话题',
  EMBED_LINKS: '嵌入链接',
  ATTACH_FILES: '上传文件',
  MENTION_EVERYONE: '@全体成员',
  MANAGE_ROLES: '管理角色',
}

// ✅ 添加类型断言，修复 TypeScript 类型错误
const PERMISSION_OPTIONS = (Object.entries(PermissionBit) as [string, number][])
  .filter(([k]) => typeof k === 'string' && isNaN(Number(k)))
  .map(([label, bit]) => ({ label, bit: bit as number, desc: PERM_LABEL_MAP[label] || label }))

onMounted(async () => {
  const sid = serverId.value
  if (sid && sid !== globalStore.currentServerId) {
    await globalStore.enterServer(sid)
    await serverStore.getServerDetail(sid)
  }
  await serverStore.getRoles(sid)
})

// 创建/编辑角色弹窗
const showCreate = ref(false)
const editingRole = ref<RoleVO | null>(null)
const roleForm = reactive({ name: '', color: '#5865f2', permissions: 0 })

function openCreate() {
  editingRole.value = null
  roleForm.name = ''
  roleForm.color = '#5865f2'
  roleForm.permissions = 0
  showCreate.value = true
}

function openEdit(role: RoleVO) {
  editingRole.value = role
  roleForm.name = role.name || ''
  roleForm.color = role.color || '#5865f2'
  roleForm.permissions = role.permissions ?? 0
  showCreate.value = true
}

function togglePerm(bit: number) {
  roleForm.permissions ^= bit
}

async function saveRole() {
  if (!roleForm.name.trim()) {
    ElMessage.warning('请输入角色名称')
    return
  }
  try {
    if (editingRole.value) {
      await apis.updateRole(serverId.value, editingRole.value.id, {
        name: roleForm.name,
        color: roleForm.color,
        permissions: roleForm.permissions,
      }).send()
    } else {
      await apis.createRole(serverId.value, {
        name: roleForm.name,
        color: roleForm.color,
        permissions: roleForm.permissions,
      }).send()
    }
    ElMessage.success(editingRole.value ? '角色已更新' : '角色已创建')
    showCreate.value = false
    await serverStore.getRoles(serverId.value)
  } catch {
    ElMessage.error('操作失败')
  }
}

async function deleteRole(roleId: number) {
  try {
    await apis.deleteRole(serverId.value, roleId).send()
    ElMessage.success('角色已删除')
    await serverStore.getRoles(serverId.value)
  } catch {
    ElMessage.error('删除失败')
  }
}

// @everyone 不可删除
const isEveryone = (role: RoleVO) => role.name === '@everyone'
</script>

<template>
  <div class="settings-roles">
    <div class="page-top">
      <h3>角色管理</h3>
      <el-button type="primary" size="small" @click="openCreate">+ 新建角色</el-button>
    </div>

    <!-- ✅ 增加加载状态保护 -->
    <div v-if="!serverStore.roles || serverStore.roles.length === 0" class="empty-tip">
      暂无角色，点击右上角新建
    </div>
    <div v-else class="role-cards">
      <div v-for="role in serverStore.roles" :key="role.id" class="role-card">
        <div class="role-card-header">
          <span class="role-color" :style="{ backgroundColor: role.color || '#5865f2' }"></span>
          <span class="role-card-name">{{ role.name }}</span>
          <span class="role-position">#{{ role.position }}</span>
        </div>
        <div class="role-card-actions">
          <el-button size="small" text @click="openEdit(role)">编辑</el-button>
          <el-button
            v-if="!isEveryone(role)"
            size="small"
            text
            type="danger"
            @click="deleteRole(role.id)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="showCreate"
      :title="editingRole ? '编辑角色' : '新建角色'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.name" maxlength="32" placeholder="例如：版主" />
        </el-form-item>
        <el-form-item label="角色颜色">
          <el-color-picker v-model="roleForm.color" show-alpha />
        </el-form-item>
        <el-form-item label="权限">
          <div class="perm-grid">
            <div
              v-for="perm in PERMISSION_OPTIONS"
              :key="perm.label"
              class="perm-item"
              :class="{ active: (roleForm.permissions & perm.bit) !== 0 }"
              @click="togglePerm(perm.bit)"
            >
              <el-checkbox
                :model-value="(roleForm.permissions & perm.bit) !== 0"
                @click.stop="togglePerm(perm.bit)"
              />
              <span class="perm-label">{{ perm.desc }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.settings-roles {
  padding: 24px;
}

.page-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
}

.role-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: var(--bg-card, rgba(255, 255, 255, 3%));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 6%));
  border-radius: 8px;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--el-color-primary);
  }
}

.role-card-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.role-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.role-card-name {
  font-size: 15px;
  font-weight: 600;
}

.role-position {
  font-size: 11px;
  color: var(--font-secondary);
}

.role-card-actions {
  display: flex;
  gap: 4px;
}

.perm-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-height: 360px;
  padding: 4px 0;
  overflow-y: auto;
}

.perm-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-hover);
  }

  &.active {
    background-color: var(--el-color-primary-light-9, rgba(88, 101, 242, 8%));
  }
}

.perm-label {
  font-size: 14px;
}

.empty-tip {
  padding: 40px 0;
  text-align: center;
  color: var(--font-secondary);
  font-size: 14px;
}
</style>