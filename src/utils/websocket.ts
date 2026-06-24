import Router from '@/router'
import { useWsLoginStore, LoginStatus } from '@/stores/ws'
import { useUserStore } from '@/stores/user'
// TODO: Person B — replace old store imports with new ones after store refactoring
// import { useChatStore } from '@/stores/chat'
// import { useServerStore } from '@/stores/server'
// import { useGlobalStore } from '@/stores/global'
import { useGroupStore } from '@/stores/group'
import { useChatStore } from '@/stores/chat'
import { useGlobalStore } from '@/stores/global'
import { useEmojiStore } from '@/stores/emoji'
import { WsResponseMessageType, WsRequestMsgType } from './wsType'
import type {
  LoginSuccessResType,
  LoginInitResType,
  WsReqMsgContentType,
  MessageDeletePayload,
  ReactionPayload,
  TypingPayload,
  MemberLeaveKickPayload,
  OnOffLinePayload,
} from './wsType'
import type { MessageVO, MemberVO } from '@/services/types'
import { computedToken } from '@/services/request'
import { worker } from './initWorker'
import shakeTitle from '@/utils/shakeTitle'
import notify from '@/utils/notification'

class WS {
  #tasks: WsReqMsgContentType[] = []
  // 重连🔐
  #connectReady = false

  constructor() {
    this.initConnect()
    // 收到消息
    worker.addEventListener('message', this.onWorkerMsg)

    // 后台重试次数达到上限之后，tab 获取焦点再重试
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.#connectReady) {
        this.initConnect()
      }

      // 获得焦点停止消息闪烁
      if (!document.hidden) {
        shakeTitle.clear()
      }
    })
  }

  initConnect = () => {
    const token = localStorage.getItem('TOKEN')
    // 如果token 是 null, 而且 localStorage 的用户信息有值，需要清空用户信息
    if (token === null && localStorage.getItem('USER_INFO')) {
      localStorage.removeItem('USER_INFO')
    }
    // 初始化 ws
    worker.postMessage(`{"type":"initWS","value":${token ? `"${token}"` : null}}`)
  }

  onWorkerMsg = (e: MessageEvent<any>) => {
    const params: { type: string; value: unknown } = JSON.parse(e.data)
    switch (params.type) {
      case 'message': {
        this.onMessage(params.value as string)
        break
      }
      case 'open': {
        this.#dealTasks()
        break
      }
      case 'close':
      case 'error': {
        this.#onClose()
        break
      }
    }
  }

  // 重置一些属性
  #onClose = () => {
    this.#connectReady = false
  }

  #dealTasks = () => {
    this.#connectReady = true

    setTimeout(() => {
      const userStore = useUserStore()
      const loginStore = useWsLoginStore()
      if (userStore.isSign) {
        // 处理堆积的任务
        this.#tasks.forEach((task) => {
          this.send(task)
        })
        // 清空缓存的消息
        this.#tasks = []
      } else {
        // 如果没登录，而且已经请求了登录二维码，就要更新登录二维码。
        loginStore.loginQrCode && loginStore.getLoginQrCode()
      }
    }, 500)
  }

  #send(msg: WsReqMsgContentType) {
    worker.postMessage(
      `{"type":"message","value":${typeof msg === 'string' ? msg : JSON.stringify(msg)}}`,
    )
  }

  send = (params: WsReqMsgContentType) => {
    if (this.#connectReady) {
      this.#send(params)
    } else {
      // 放到队列
      this.#tasks.push(params)
    }
  }

  // ============ 新增方法（Phase 1）============

  /** 批量订阅频道 */
  subscribeChannel(channelIds: number[]) {
    this.send({ type: WsRequestMsgType.SUBSCRIBE_CHANNEL, data: { channelIds } })
  }

  /** 批量退订频道 */
  unsubscribeChannel(channelIds: number[]) {
    this.send({ type: WsRequestMsgType.UNSUBSCRIBE_CHANNEL, data: { channelIds } })
  }

  /** 订阅 Thread */
  subscribeThread(threadId: number) {
    this.send({ type: WsRequestMsgType.SUBSCRIBE_THREAD, data: { threadId } })
  }

  /** 退订 Thread */
  unsubscribeThread(threadId: number) {
    this.send({ type: WsRequestMsgType.UNSUBSCRIBE_THREAD, data: { threadId } })
  }

  /** 发送输入开始（调用方需自行防抖 2s） */
  sendTypingStart(channelId: number) {
    this.send({ type: WsRequestMsgType.TYPING_START, data: { channelId } })
  }

  /** 发送输入停止 */
  sendTypingStop(channelId: number) {
    this.send({ type: WsRequestMsgType.TYPING_STOP, data: { channelId } })
  }

  // 收到消息回调
  onMessage = (value: string) => {
    // FIXME 可能需要 try catch,
    const params: { type: WsResponseMessageType; data: unknown } = JSON.parse(value)
    const loginStore = useWsLoginStore()
    const userStore = useUserStore()
    const chatStore = useChatStore()
    const groupStore = useGroupStore()
    const globalStore = useGlobalStore()
    const emojiStore = useEmojiStore()
    switch (params.type) {
      // ====== 登录相关（复用 MallChat） ======
      // 获取登录二维码
      case WsResponseMessageType.LOGIN_URL: {
        const data = params.data as LoginInitResType
        loginStore.loginQrCode = data.loginUrl
        break
      }
      // 等待授权
      case WsResponseMessageType.LOGIN_SCAN_SUCCESS: {
        loginStore.loginStatus = LoginStatus.Waiting
        break
      }
      // 登录成功
      case WsResponseMessageType.LOGIN_SUCCESS: {
        userStore.isSign = true
        const data = params.data as LoginSuccessResType
        const { token, uid, name, avatar } = data
        // 映射 WS 字段到 UserVO 字段: uid→id, name→nickname
        const userInfo = { id: uid, nickname: name, avatar, uid, name }
        userStore.userInfo = { ...userStore.userInfo, ...userInfo }
        localStorage.setItem('USER_INFO', JSON.stringify(userInfo))
        localStorage.setItem('TOKEN', token)
        // 更新一下请求里面的 token.
        computedToken.clear()
        computedToken.get()
        loginStore.loginStatus = LoginStatus.Success
        // 获取用户详情
        userStore.getUserDetailAction()
        // 关闭登录弹窗
        loginStore.showLogin = false
        // 清空登录二维码
        loginStore.loginQrCode = undefined
        // 自定义表情列表 — TODO: Person B 适配 Server 级表情
        emojiStore.getEmojiList()
        break
      }
      // Token 过期
      case WsResponseMessageType.INVALIDATE_TOKEN: {
        userStore.isSign = false
        userStore.userInfo = {}
        localStorage.removeItem('USER_INFO')
        localStorage.removeItem('TOKEN')
        loginStore.loginStatus = LoginStatus.Init
        break
      }

      // ====== 消息相关 ======
      // 新消息推送
      case WsResponseMessageType.MESSAGE_CREATE: {
        const data = params.data as MessageVO
        // TODO: Person B — 根据 threadId 分流到 pushMessage 或 pushThreadMessage
        if (data.threadId) {
          // chatStore.pushThreadMessage(data)
        } else {
          // chatStore.pushMessage(data)
        }
        // 临时: 继续支持旧的 pushMsg（待 B 完成后移除）
        // chatStore.pushMsg(data as any)
        break
      }
      // 消息编辑推送（type=21：完整 MessageVO）
      case WsResponseMessageType.MESSAGE_UPDATE: {
        const data = params.data as MessageVO
        // TODO: Person B — chatStore.editMessage(data.id, data.content)
        console.log('[WS] MESSAGE_UPDATE msgId=', data?.id)
        break
      }
      // 消息删除推送（type=22：{ msgId, channelId }）
      case WsResponseMessageType.MESSAGE_DELETE: {
        const data = params.data as MessageDeletePayload
        // TODO: Person B — chatStore.deleteMessage(data.msgId)
        console.log('[WS] MESSAGE_DELETE msgId=', data?.msgId)
        break
      }

      // ====== Reaction 相关 ======
      // Reaction 添加/移除（type=23/24: { messageId, e, uid, count }）
      case WsResponseMessageType.REACTION_ADD:
      case WsResponseMessageType.REACTION_REMOVE: {
        const data = params.data as ReactionPayload
        // TODO: Person B — chatStore.updateReaction(data.messageId, { emoji: data.e, uid: data.uid, count: data.count })
        console.log('[WS] REACTION', data?.e, 'count=', data?.count)
        break
      }

      // ====== 输入状态 ======
      // type=25/26: { cid, tid, uid }
      case WsResponseMessageType.TYPING_START_PUSH:
      case WsResponseMessageType.TYPING_STOP_PUSH: {
        const data = params.data as TypingPayload
        // TODO: Person C — UI 显示"xxx 正在输入..."
        console.log('[WS] TYPING cid=', data?.cid, 'uid=', data?.uid)
        break
      }

      // ====== 成员相关 ======
      // type=30: 完整 MemberVO 对象
      case WsResponseMessageType.MEMBER_JOIN: {
        const data = params.data as MemberVO
        // TODO: Person B — serverStore.addMember(data); 系统消息
        console.log('[WS] MEMBER_JOIN userId=', data?.userId, 'nickname=', data?.nickname)
        break
      }
      // type=31/32: { sid, uid }
      case WsResponseMessageType.MEMBER_LEAVE: {
        const data = params.data as MemberLeaveKickPayload
        // TODO: Person B — serverStore.removeMember(data.uid)
        console.log('[WS] MEMBER_LEAVE uid=', data?.uid)
        break
      }
      case WsResponseMessageType.MEMBER_KICK: {
        const data = params.data as MemberLeaveKickPayload
        // TODO: Person B — serverStore.removeMember(data.uid); 系统消息
        console.log('[WS] MEMBER_KICK uid=', data?.uid)
        break
      }

      // ====== Thread 相关 ======
      // type=34: 完整 ThreadVO 对象
      case WsResponseMessageType.THREAD_CREATE: {
        // TODO: Person B — 在频道内显示 Thread 入口
        console.log('[WS] THREAD_CREATE', params.data)
        break
      }

      // ====== 在线状态 ======
      // type=40/41: { uid }
      case WsResponseMessageType.USER_ONLINE: {
        const data = params.data as OnOffLinePayload
        // TODO: Person B — serverStore.updateOnlineStatus(data.uid, true)
        console.log('[WS] USER_ONLINE uid=', data?.uid)
        break
      }
      case WsResponseMessageType.USER_OFFLINE: {
        const data = params.data as OnOffLinePayload
        // TODO: Person B — serverStore.updateOnlineStatus(data.uid, false)
        console.log('[WS] USER_OFFLINE uid=', data?.uid)
        break
      }

      // ====== 频道/服务器变更 ======
      // type=50/51: 完整 ChannelVO 对象；type=52: { cid }
      case WsResponseMessageType.CHANNEL_CREATE:
      case WsResponseMessageType.CHANNEL_UPDATE:
      case WsResponseMessageType.CHANNEL_DELETE: {
        // TODO: Person B — serverStore 更新频道信息
        console.log('[WS] CHANNEL_CHANGE type=', params.type)
        break
      }
      // type=53: 完整 ServerVO 对象
      case WsResponseMessageType.SERVER_UPDATE: {
        // TODO: Person B — serverStore 更新服务器信息
        console.log('[WS] SERVER_UPDATE', params.data)
        break
      }

      // ====== 错误 ======
      case WsResponseMessageType.ERROR: {
        console.error('[WS] ERROR', params.data)
        break
      }

      default: {
        console.log('接收到未处理类型的消息:', params)
        break
      }
    }
  }
}

export default new WS()
