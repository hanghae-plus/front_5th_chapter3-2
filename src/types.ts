export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RepeatEndType = 'endDate' | 'endCount' | 'none';
export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
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
  repeatEndType?: RepeatEndType;
  repeatEndCount?: number;
}

export interface Event extends EventForm {
  id: string;
}
