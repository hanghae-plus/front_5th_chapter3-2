export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RepeatEndType = 'date' | 'count';

export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endType: RepeatEndType;
  endDate?: string; // endType === 'date' 일 때만 사용
  count?: number; // endType === 'count' 일 때만 사용
}

export interface EventForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  repeat: RepeatInfo;
  notificationTime: number; // 분 단위로 저장
}

export interface Event extends EventForm {
  id: string;
}
