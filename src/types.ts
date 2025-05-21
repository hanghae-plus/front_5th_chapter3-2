export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RepeatEndType = 'count' | 'date' | 'none';

export interface RepeatInfo {
  type: RepeatType; // 반복 유형
  interval: number; // 반복 간격
  endType: RepeatEndType; // 반복 종료 유형
  endDate?: string; // 반복 종료 날짜
  endCount?: number; // 반복 종료 횟수
}

export interface EventForm {
  id: unknown;
  isRecurring: any;
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
  isRecurring: any;
  id: string;
}
