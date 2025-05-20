export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RepeatEndType = 'never' | 'date' | 'count';
export type MonthlyRepeatType = 'date' | 'weekday';

/**
 * @interval 반복 주기
 * @dayOfWeek 주간 반복 시 특정 요일만 반복하기 위한 배열 [1, 2, 3, 4, 5]
 * @endDate 반복 종료 날짜
 *
 */
export interface RepeatInfo {
  id?: string;
  type: RepeatType;
  interval: number;
  endType?: RepeatEndType;
  endDate?: string;
  endCount?: number;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  excludedDates?: string[]; // dates to exclude from repetition
  monthlyRepeatType?: MonthlyRepeatType; // for monthly repetition
  monthlyWeekday?: {
    // for monthly weekday repetition
    week: number; // 1-5 for first-fifth week
    day: number; // 0-6 for Sunday-Saturday
  };
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
