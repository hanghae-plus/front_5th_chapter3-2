export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BaseRepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
  count?: number;
}

export interface RepeatInfo extends BaseRepeatInfo {
  id?: string;
}

export interface EventForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  repeat: BaseRepeatInfo;
  notificationTime: number; // 분 단위로 저장
}

export interface Event extends EventForm {
  id: string;
  repeat: RepeatInfo;
}

export type RepeatEndType = 'none' | 'date' | 'count';
