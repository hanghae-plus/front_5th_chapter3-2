export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RepeatEndType = 'endDate' | 'endCount';
export interface RepeatInfo {
  id?: string;
  type: RepeatType;
  interval: number;
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
  repeatEnd?: {
    type: RepeatEndType;
    endDate?: string;
    endCount?: number;
  };
}

export interface Event extends EventForm {
  id: string;
}
