import Router from '@/router'
import { useWsLoginStore, LoginStatus } from '@/stores/ws'
import { useUserStore } from '@/stores/user'
import { useServerStore } from '@/stores/server'
import { useChatStore } from '@/stores/chat'
import { useGlobalStore } from '@/stores/global'
import { useEmojiStore } from '@/stores/emoji'
import { WsResponseMessageType, WsRequestMsgType } from './wsType'
import type {
  LoginSuccessResType,
  WsReqMsgContentType,
  MessageDeletePayload,
  ReactionPayload,
  TypingPayload,
  MemberLeaveKickPayload,
  OnOffLinePayload,
} from './wsType'
import type { MessageVO, MemberVO, ThreadVO } from '@/services/types'
import { computedToken } from '@/services/request'
import { worker } from './initWorker'
import shakeTitle from '@/utils/shakeTitle'
import notify from '@/utils/notification'
import eventBus from '@/utils/eventBus'

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
    this.send({ type: WsRequestMsgType.SUBSCRIBE_CHANNEL, data: { channelId: channelIds[0] } })
  }

  /** 批量退订频道 */
  unsubscribeChannel(channelIds: number[]) {
    this.send({ type: WsRequestMsgType.UNSUBSCRIBE_CHANNEL, data: { channelId: channelIds[0] } })
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
    let params: { type: WsResponseMessageType; data: unknown }
    try {
      params = JSON.parse(value)
    } catch {
      console.error('[WS] JSON.parse 失败，原始消息:', value)
      return
    }
    const loginStore = useWsLoginStore()
    const userStore = useUserStore()
    const serverStore = useServerStore()
    const chatStore = useChatStore()
    const globalStore = useGlobalStore()
    const emojiStore = useEmojiStore()
    switch (params.type) {
      // ====== 登录相关 ======
      // 登录成功（JWT 鉴权通过后 WS 推送）
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
        userStore.getUserMeAction()
        // 关闭登录弹窗
        loginStore.showLogin = false
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
        if (data.threadId) {
          chatStore.pushThreadMessage(data)
        } else {
          chatStore.pushMessage(data)
        }
        break
      }
      case WsResponseMessageType.MESSAGE_UPDATE: {
        const data = params.data as MessageVO
        chatStore.editMessage(data.id, data.content)
        break
      }
      case WsResponseMessageType.MESSAGE_DELETE: {
        const data = params.data as MessageDeletePayload
        chatStore.deleteMessage(data.msgId)
        break
      }

      // ====== Reaction 相关 ======
      case WsResponseMessageType.REACTION_ADD:
      case WsResponseMessageType.REACTION_REMOVE: {
        const data = params.data as ReactionPayload
        const isAdd = (params.type as WsResponseMessageType) === WsResponseMessageType.REACTION_ADD
        chatStore.updateReaction(data.messageId, {
          emoji: data.e,
          count: data.count,
          userIds: [],
          reacted: isAdd && data.uid === userStore.userInfo.id,
        })
        break
      }

      // ====== 输入状态 ======
      case WsResponseMessageType.TYPING_START_PUSH: {
        const data = params.data as TypingPayload
        eventBus.emit('typingUsers', {
          channelId: data.cid,
          threadId: data.tid,
          userId: data.uid,
          isTyping: true,
        })
        break
      }
      case WsResponseMessageType.TYPING_STOP_PUSH: {
        const data = params.data as TypingPayload
        eventBus.emit('typingUsers', {
          channelId: data.cid,
          threadId: data.tid,
          userId: data.uid,
          isTyping: false,
        })
        break
      }

      // ====== 成员相关 ======
      case WsResponseMessageType.MEMBER_JOIN: {
        const data = params.data as MemberVO
        serverStore.addMember(data)
        break
      }
      case WsResponseMessageType.MEMBER_LEAVE: {
        const data = params.data as MemberLeaveKickPayload
        serverStore.removeMember(data.uid)
        break
      }
      case WsResponseMessageType.MEMBER_KICK: {
        const data = params.data as MemberLeaveKickPayload
        serverStore.removeMember(data.uid)
        break
      }

      // ====== Thread 相关 ======
      case WsResponseMessageType.THREAD_CREATE: {
        const data = params.data as ThreadVO
        // 将 Thread 摘要写入 rootMsgId 对应的消息，UI 通过 msg.thread 显示入口
        chatStore.setMessageThread(data.rootMsgId, {
          id: data.id,
          name: data.name,
          messageCount: data.messageCount ?? 1,
        })
        break
      }

      // ====== 在线状态 ======
      case WsResponseMessageType.USER_ONLINE: {
        const data = params.data as OnOffLinePayload
        serverStore.updateOnlineStatus(data.uid, true)
        break
      }
      case WsResponseMessageType.USER_OFFLINE: {
        const data = params.data as OnOffLinePayload
        serverStore.updateOnlineStatus(data.uid, false)
        break
      }

      // ====== 频道/服务器变更 ======
      case WsResponseMessageType.CHANNEL_CREATE: {
        // ChannelVO 不含 categoryId，刷新服务器详情获取完整分类树
        const sid = globalStore.currentServerId
        if (sid) serverStore.getServerDetail(sid)
        break
      }
      case WsResponseMessageType.CHANNEL_UPDATE: {
        const data = params.data as import('@/services/types').ChannelVO
        serverStore.updateChannel(data)
        break
      }
      case WsResponseMessageType.CHANNEL_DELETE: {
        const payload = params.data as import('./wsType').ChannelDeletePayload
        serverStore.removeChannelFromTree(payload.cid)
        break
      }
      case WsResponseMessageType.SERVER_UPDATE: {
        const data = params.data as import('@/services/types').ServerVO
        serverStore.currentServer = data
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
