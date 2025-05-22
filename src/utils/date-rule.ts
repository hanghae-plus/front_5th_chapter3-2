/**
 * 구글 캘린더와 유사한 간단한 반복 규칙 엔진
 */

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// 월별 반복 패턴 확장 - 일반 n번째 요일 또는 마지막 요일
type MonthlyPattern = 'nthDay' | 'lastDay';

interface DateRuleOptions {
  frequency: Frequency;
  interval: number; // 반복 간격 (1 이상)
  start: Date; // 반복 시작일
  until: Date; // 반복 종료일 (포함)
}

export class DateRule {
  private frequency: Frequency;
  private interval: number;
  private start: Date;
  private until: Date;
  private baseDate: Date;
  private startDayOfWeek?: number;
  private startWeekOfMonth?: number;
  private monthlyPattern?: MonthlyPattern;
  private startTime: { hours: number; minutes: number; seconds: number };

  /**
   * 반복 일정 규칙 생성자
   * @param options - 반복 규칙 옵션
   */
  constructor(options: DateRuleOptions) {
    if (
      !options.frequency ||
      !['daily', 'weekly', 'monthly', 'yearly'].includes(options.frequency)
    ) {
      throw new Error('유효한 frequency가 필요합니다: daily, weekly, monthly, yearly');
    }

    if (!Number.isInteger(options.interval) || options.interval < 1) {
      throw new Error('interval은 1 이상의 정수여야 합니다');
    }

    if (!(options.start instanceof Date) || isNaN(options.start.getTime())) {
      throw new Error('유효한 start 날짜가 필요합니다');
    }

    if (!(options.until instanceof Date) || isNaN(options.until.getTime())) {
      throw new Error('유효한 until 날짜가 필요합니다');
    }

    // 날짜 비교 시 시간 정보 제거
    if (this._normalizeDate(options.start) > this._normalizeDate(options.until)) {
      throw new Error('start 날짜는 until 날짜보다 이전이어야 합니다');
    }

    // 원본 시간 정보 저장
    this.startTime = {
      hours: options.start.getHours(),
      minutes: options.start.getMinutes(),
      seconds: options.start.getSeconds(),
    };

    // 시간 정보가 제거된 날짜 객체로 초기화
    this.start = this._normalizeDate(options.start);
    this.until = this._normalizeDate(options.until);
    // until은 해당 날짜의 마지막 시점(23:59:59)으로 설정하여 종료일 포함
    this.until.setHours(23, 59, 59, 999);

    // 첫 날짜의 기준점을 저장
    this.baseDate = this._normalizeDate(options.start);

    this.frequency = options.frequency;
    this.interval = options.interval;

    // monthly 빈도에서 사용할 요일 정보와 패턴 저장
    if (this.frequency === 'monthly') {
      this.startDayOfWeek = this.start.getDay();
      this.startWeekOfMonth = this._getWeekOfMonth(this.start);

      // 해당 월의 마지막 특정 요일인지 확인
      this.monthlyPattern = this._isLastDayOfWeekInMonth(this.start) ? 'lastDay' : 'nthDay';
    }
  }

  /**
   * 날짜에서 시간 정보를 제거하고 날짜만 포함하는 새 Date 객체 반환
   * @param date - 원본 날짜
   * @returns 시간이 00:00:00으로 설정된 새 Date 객체
   * @private
   */
  private _normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * 날짜에 원본 시간 정보를 적용한 새로운 Date 객체 반환
   * @param date - 시간 정보를 적용할 날짜
   * @returns 원본 시간 정보가 적용된 새 Date 객체
   * @private
   */
  private _applyOriginalTime(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      this.startTime.hours,
      this.startTime.minutes,
      this.startTime.seconds
    );
  }

  /**
   * 시작일부터 종료일까지 모든 반복일을 반환
   * @returns 반복 날짜 배열
   */
  all(): Date[] {
    return this.between(this.start, this.until);
  }

  /**
   * 특정 범위 내의 반복일을 반환 (start, end 포함)
   * @param start - 범위 시작일
   * @param end - 범위 종료일
   * @returns 반복 날짜 배열
   */
  between(start: Date, end: Date): Date[] {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      throw new Error('유효한 start 날짜가 필요합니다');
    }

    if (!(end instanceof Date) || isNaN(end.getTime())) {
      throw new Error('유효한 end 날짜가 필요합니다');
    }

    // 날짜 비교를 위해 시간 정보를 제거한 복사본 생성
    const startWithoutTime = this._normalizeDate(start);
    const endWithoutTime = this._normalizeDate(end);
    endWithoutTime.setHours(23, 59, 59, 999); // 종료일은 해당 날짜의 마지막 순간으로 설정

    const thisStartWithoutTime = this._normalizeDate(this.start);
    const thisUntilWithoutTime = this._normalizeDate(this.until);

    // start가 this.until 이후거나 end가 this.start 이전이면 빈 배열 반환
    if (startWithoutTime > thisUntilWithoutTime || endWithoutTime < thisStartWithoutTime) {
      return [];
    }

    // 유효 범위로 조정 (시간 정보 없이 날짜만 비교)
    const effectiveStart = new Date(
      Math.max(startWithoutTime.getTime(), thisStartWithoutTime.getTime())
    );
    const effectiveEnd = new Date(
      Math.min(endWithoutTime.getTime(), thisUntilWithoutTime.getTime())
    );

    const dates: Date[] = [];

    // 빈도에 따라 다른 계산 메서드 호출
    switch (this.frequency) {
      case 'daily':
        this._calculateDailyOccurrences(effectiveStart, effectiveEnd, dates);
        break;
      case 'weekly':
        this._calculateWeeklyOccurrences(effectiveStart, effectiveEnd, dates);
        break;
      case 'monthly':
        this._calculateMonthlyOccurrences(effectiveStart, effectiveEnd, dates);
        break;
      case 'yearly':
        this._calculateYearlyOccurrences(effectiveStart, effectiveEnd, dates);
        break;
    }

    return dates;
  }

  /**
   * 날짜가 해당 월의 몇 번째 주인지 계산
   * @param date - 계산할 날짜
   * @returns 해당 월의 몇 번째 주인지 (1-5)
   * @private
   */
  private _getWeekOfMonth(date: Date): number {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일

    // 날짜의 일(day)에 첫 날의 요일을 더하고 7로 나눈 몫에 1을 더하면 해당 월의 몇 번째 주인지 계산할 수 있음
    return Math.ceil((date.getDate() + dayOfWeek) / 7);
  }

  /**
   * 날짜가 해당 월의 마지막 특정 요일인지 확인
   * 예: 5월의 마지막 월요일, 6월의 마지막 화요일 등
   * @param date - 확인할 날짜
   * @returns 해당 월의 마지막 특정 요일이면 true, 아니면 false
   * @private
   */
  private _isLastDayOfWeekInMonth(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    // 현재 날짜
    const currentDay = date.getDate();

    // 같은 요일 중 다음 날짜를 계산
    const nextSameDayOfWeekDate = currentDay + 7;

    // 다음 같은 요일이 다음 달이면 현재 날짜는 이번 달의 마지막 해당 요일
    return nextSameDayOfWeekDate > lastDayOfMonth;
  }

  /**
   * 특정 월의 n번째 요일 찾기
   * @param year - 연도
   * @param month - 월 (0-11)
   * @param dayOfWeek - 요일 (0: 일요일, ..., 6: 토요일)
   * @param weekOfMonth - 월의 몇 번째 주 (1-5)
   * @returns 해당하는 날짜 또는 null (해당 월에 n번째 요일이 없는 경우)
   * @private
   */
  private _findNthDayOfWeek(
    year: number,
    month: number,
    dayOfWeek: number,
    weekOfMonth: number
  ): Date | null {
    // 해당 월의 첫 날
    const firstDayOfMonth = new Date(year, month, 1);

    // 첫 번째 특정 요일까지의 일수 계산
    let daysDiff = dayOfWeek - firstDayOfMonth.getDay();
    if (daysDiff < 0) daysDiff += 7;

    // n번째 특정 요일의 날짜 계산
    const nthDayDate = 1 + daysDiff + (weekOfMonth - 1) * 7;

    // 해당 월에 그 날짜가 존재하는지 확인
    const result = new Date(year, month, nthDayDate);
    if (result.getMonth() !== month) {
      // 해당 월을 넘어간 경우 (예: 5번째 화요일이 없는 경우)
      return null;
    }

    return result;
  }

  /**
   * 특정 월의 마지막 특정 요일 찾기
   * @param year - 연도
   * @param month - 월 (0-11)
   * @param dayOfWeek - 요일 (0: 일요일, ..., 6: 토요일)
   * @returns 해당하는 날짜
   * @private
   */
  private _findLastDayOfWeekInMonth(year: number, month: number, dayOfWeek: number): Date {
    // 다음 달의 첫날
    const firstDayOfNextMonth = new Date(year, month + 1, 1);

    // 마지막 날짜 계산을 위해 다음 달 첫날에서 하루 빼기
    const lastDayOfMonth = new Date(firstDayOfNextMonth);
    lastDayOfMonth.setDate(lastDayOfMonth.getDate() - 1);

    // 마지막 날짜의 요일
    const lastDayOfWeek = lastDayOfMonth.getDay();

    // 원하는 요일까지 몇 일 전인지 계산
    let daysToSubtract = (lastDayOfWeek - dayOfWeek + 7) % 7;

    // 마지막 특정 요일 계산
    const result = new Date(lastDayOfMonth);
    result.setDate(lastDayOfMonth.getDate() - daysToSubtract);

    return result;
  }

  /**
   * 일별 반복 계산
   * @param start - 범위 시작일
   * @param end - 범위 종료일
   * @param dates - 결과를 저장할 배열
   * @private
   */
  private _calculateDailyOccurrences(start: Date, end: Date, dates: Date[]): void {
    // 기준일로부터 시작일까지 몇 번의 간격이 있는지 계산
    const daysDiff = Math.floor(
      (start.getTime() - this.baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const intervalsPassed = Math.floor(daysDiff / this.interval);

    // 유효 간격 내의 첫 번째 발생일 계산
    let firstOccurrence = new Date(this.baseDate);
    firstOccurrence.setDate(this.baseDate.getDate() + intervalsPassed * this.interval);

    // 첫 발생일이 시작일보다 이전이면 다음 간격으로 이동
    if (firstOccurrence < start) {
      firstOccurrence.setDate(firstOccurrence.getDate() + this.interval);
    }

    // 각 발생일 계산
    let currentDate = new Date(firstOccurrence);
    while (currentDate <= end) {
      // 원본 시간 정보를 적용한 결과 추가
      dates.push(this._applyOriginalTime(currentDate));
      currentDate.setDate(currentDate.getDate() + this.interval);
    }
  }

  /**
   * 주별 반복 계산
   * @param start - 범위 시작일
   * @param end - 범위 종료일
   * @param dates - 결과를 저장할 배열
   * @private
   */
  private _calculateWeeklyOccurrences(start: Date, end: Date, dates: Date[]): void {
    // 기준일의 요일
    const baseDayOfWeek = this.baseDate.getDay();

    // 시작일에서 가장 가까운 기준요일 찾기
    let currentDate = new Date(start);

    // 시작일이 기준 요일과 같지 않으면, 이전 기준 요일로 이동
    if (currentDate.getDay() !== baseDayOfWeek) {
      const daysToSubtract = (currentDate.getDay() - baseDayOfWeek + 7) % 7;
      currentDate.setDate(currentDate.getDate() - daysToSubtract);
    }

    // 기준일로부터 현재일까지 몇 주가 지났는지 계산
    const weeksDiff = Math.floor(
      (currentDate.getTime() - this.baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const intervalsPassed = Math.floor(weeksDiff / this.interval);

    // 정확한 간격으로 조정
    currentDate = new Date(this.baseDate);
    currentDate.setDate(this.baseDate.getDate() + intervalsPassed * this.interval * 7);

    // 다음 간격으로 이동 (필요시)
    if (currentDate < start) {
      currentDate.setDate(currentDate.getDate() + this.interval * 7);
    }

    // 각 발생일 계산
    while (currentDate <= end) {
      if (currentDate >= start) {
        // 원본 시간 정보를 적용한 결과 추가
        dates.push(this._applyOriginalTime(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + this.interval * 7);
    }
  }

  /**
   * 월별 반복 계산
   * @param start - 범위 시작일
   * @param end - 범위 종료일
   * @param dates - 결과를 저장할 배열
   * @private
   */
  private _calculateMonthlyOccurrences(start: Date, end: Date, dates: Date[]): void {
    // 시작월 설정
    let currentYear = start.getFullYear();
    let currentMonth = start.getMonth();

    // 기준일의 연, 월
    const baseYear = this.baseDate.getFullYear();
    const baseMonth = this.baseDate.getMonth();

    // 기준월로부터 몇 개월이 지났는지 계산
    const monthsDiff = (currentYear - baseYear) * 12 + (currentMonth - baseMonth);
    const intervalsPassed = Math.floor(monthsDiff / this.interval);

    // 정확한 간격으로 조정
    currentYear = baseYear + Math.floor((baseMonth + intervalsPassed * this.interval) / 12);
    currentMonth = (baseMonth + intervalsPassed * this.interval) % 12;

    // 각 월별 특정 패턴 날짜 계산
    while (new Date(currentYear, currentMonth) <= end) {
      let occurrenceDate: Date | null = null;

      // 패턴에 따라 다른 계산 방식 적용
      if (this.monthlyPattern === 'lastDay') {
        // 마지막 특정 요일 계산
        occurrenceDate = this._findLastDayOfWeekInMonth(
          currentYear,
          currentMonth,
          this.startDayOfWeek!
        );
      } else {
        // n번째 특정 요일 계산
        occurrenceDate = this._findNthDayOfWeek(
          currentYear,
          currentMonth,
          this.startDayOfWeek!,
          this.startWeekOfMonth!
        );
      }

      // 해당 월에 특정 패턴의 날짜가 존재하고, 범위 내에 있으면 추가
      if (
        occurrenceDate &&
        this._normalizeDate(occurrenceDate) >= this._normalizeDate(start) &&
        this._normalizeDate(occurrenceDate) <= this._normalizeDate(end)
      ) {
        // 원본 시간 정보를 적용한 결과 추가
        dates.push(this._applyOriginalTime(occurrenceDate));
      }

      // 다음 간격으로 이동
      currentMonth += this.interval;
      if (currentMonth >= 12) {
        currentYear += Math.floor(currentMonth / 12);
        currentMonth %= 12;
      }
    }
  }

  /**
   * 연별 반복 계산
   * @param start - 범위 시작일
   * @param end - 범위 종료일
   * @param dates - 결과를 저장할 배열
   * @private
   */
  private _calculateYearlyOccurrences(start: Date, end: Date, dates: Date[]): void {
    // 기준일의 월, 일
    const baseMonth = this.baseDate.getMonth();
    const baseDay = this.baseDate.getDate();

    // 시작년도 설정
    let currentYear = start.getFullYear();

    // 기준년도로부터 몇 년이 지났는지 계산
    const yearsDiff = currentYear - this.baseDate.getFullYear();
    const intervalsPassed = Math.floor(yearsDiff / this.interval);

    // 정확한 간격으로 조정
    currentYear = this.baseDate.getFullYear() + intervalsPassed * this.interval;

    // 시작년도가 첫 발생년도보다 이후면 다음 간격으로 이동
    if (new Date(currentYear, baseMonth, baseDay) < start) {
      currentYear += this.interval;
    }

    // 각 발생일 계산
    while (currentYear <= end.getFullYear()) {
      // 해당 날짜 생성 (윤년 처리 포함)
      let occurrenceDate: Date | null = null;

      // 2월 29일 특수 케이스 처리 (윤년 확인)
      if (baseMonth === 1 && baseDay === 29) {
        // 윤년인지 확인
        const isLeapYear =
          (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;

        if (isLeapYear) {
          occurrenceDate = new Date(currentYear, baseMonth, baseDay);
        }
        // 윤년이 아니면 해당 년도는 건너뜀
      } else {
        occurrenceDate = new Date(currentYear, baseMonth, baseDay);
      }

      // 유효한 날짜이고 범위 내에 있으면 추가 (시간 제외하고 날짜만 비교)
      if (
        occurrenceDate &&
        this._normalizeDate(occurrenceDate) >= this._normalizeDate(start) &&
        this._normalizeDate(occurrenceDate) <= this._normalizeDate(end)
      ) {
        // 원본 시간 정보를 적용한 결과 추가
        dates.push(this._applyOriginalTime(occurrenceDate));
      }

      // 다음 간격으로 이동
      currentYear += this.interval;
    }
  }
}
