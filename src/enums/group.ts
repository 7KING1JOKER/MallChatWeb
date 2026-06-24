/**
 * @deprecated 已废弃 — 群组角色映射被 RBAC PermissionBit 替代。
 * 此文件仅作临时兼容，待 Person C 重构 UserItem 组件后删除。
 * @see src/services/types.ts PermissionBit
 */
export const GROUP_ROLE_MAP: Record<string, { text: string; class: string }> = {
  '1': {
    text: '管理员',
    class: 'admin',
  },
  '2': {
    text: '成员',
    class: 'member',
  },
}
