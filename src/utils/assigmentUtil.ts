import { RepeatType } from '../types';

/** 1. 반복유형 설정 */
export function calculateNextRepeatDate(
  startDate: Date,
  repeatType: RepeatType,
  occurrences: number
): Date {
  // 원본 날짜를 변경하지 않기 위해 복사본 생성
  const result = new Date(startDate);

  // 원래 날짜 저장 (모든 case에서 사용 가능하도록 switch 밖으로 이동)
  const originalDay = startDate.getDate();
  const originalMonth = startDate.getMonth();

  switch (repeatType) {
    case 'daily': {
      result.setDate(result.getDate() + occurrences);
      break;
    }
    case 'weekly': {
      result.setDate(result.getDate() + occurrences * 7);
      break;
    }
    case 'monthly': {
      result.setDate(1);
      result.setMonth(result.getMonth() + occurrences);
      const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(originalDay, lastDayOfMonth));
      break;
    }
    case 'yearly': {
      result.setFullYear(result.getFullYear() + occurrences);

      // 2월 29일 특별 처리
      if (originalMonth === 1 && originalDay === 29) {
        // 현재 년도가 윤년인지 확인
        const isLeapYear =
          (result.getFullYear() % 4 === 0 && result.getFullYear() % 100 !== 0) ||
          result.getFullYear() % 400 === 0;

        if (!isLeapYear) {
          // 윤년이 아니면 2월 28일로 설정
          result.setMonth(1); // 2월
          result.setDate(28);
        }
      }
      break;
    }
  }

  return result;
}
