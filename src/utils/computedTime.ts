import dayjs from 'dayjs'
import type { Dayjs, OpUnitType, ConfigType } from 'dayjs'

const intervalTime = 300000; const computedCountMax = 20; let computedCount = 0

const timeToStr = (time: number) => {
  const sendTime = dayjs(time); const gapDay = dayjs().endOf('day').diff(sendTime, 'day')
  const isLastWeek = gapDay >= 7
  return gapDay < 2 ? `${gapDay === 1 ? '昨天 ' : ''}${sendTime.format('HH:mm')}` : isLastWeek ? sendTime.format('YYYY-MM-DD HH:mm') : dayjs(sendTime).format('dddd HH:mm')
}

const checkTimeInterval = (cur: any, pre: any) => {
  const curTime = cur.createTime ? dayjs(cur.createTime).valueOf() : 0
  const preTime = pre.createTime ? dayjs(pre.createTime).valueOf() : 0
  if ((pre && curTime - preTime > intervalTime) || computedCount >= computedCountMax) { computedCount = 0; return { ...cur, timeBlock: timeToStr(curTime) } }
  else { computedCount += 1; return cur }
}

export const computedTimeBlock = (list: any[], needFirst = true) => {
  if (!list || list.length === 0) return []
  const temp = needFirst ? [list[0]] : []
  for (let i = 1; i < list.length; i++) temp.push(checkTimeInterval(list[i], list[i - 1]))
  return temp
}

export const formatTimestamp = (timestamp: number): string => {
  const now: Dayjs = dayjs(); const date: Dayjs = dayjs(timestamp)
  if (now.isSame(date, 'day')) return date.format('HH:mm')
  else if (now.diff(date, 'year') >= 1) return date.format('YYYY年MM月DD日')
  else return date.format('MM月DD日')
}
export const isDiffNow = ({ time, unit, diff }: { unit: OpUnitType; time: ConfigType; diff: number }) => dayjs().diff(dayjs(time), unit) > diff
export const isDiffNow10Min = (time: ConfigType): boolean => isDiffNow({ time, unit: 'minute', diff: 10 })
