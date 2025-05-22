import { describe, it, expect } from 'vitest';

import { calculateNextRepeatDate } from '../../utils/assigmentUtil';

describe('일정 생성 혹은 수정시에 반복 유형을 선택하고 검증하는 테스트', () => {
  it('매일 반복 시 지정된 일수만큼 날짜를 증가시켜야 한다', () => {
    const startDate = new Date(2024, 4, 15); // 2024년 5월 15일
    const result = calculateNextRepeatDate(startDate, 'daily', 5);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(4); // 5월
    expect(result.getDate()).toBe(20); // 15 + 5 = 20일
  });

  it('매주 반복 시 지정된 주수만큼 날짜를 증가시켜야 한다', () => {
    const startDate = new Date(2024, 4, 15); // 2024년 5월 15일
    const result = calculateNextRepeatDate(startDate, 'weekly', 2);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(29);
  });

  it('매월 반복 시 지정된 월수만큼 날짜를 증가시켜야 한다', () => {
    const startDate = new Date(2024, 4, 15); // 2024년 5월 15일
    const result = calculateNextRepeatDate(startDate, 'monthly', 3);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(7); // 8월
    expect(result.getDate()).toBe(15); // 15일 그대로
  });

  it('매월 반복 시 31일에서 30일까지만 있는 달로 계산하면 해당 달의 마지막 날이어야 한다', () => {
    const startDate = new Date(2024, 0, 31); // 2024년 1월 31일
    const result = calculateNextRepeatDate(startDate, 'monthly', 3);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(30);
  });

  it('매월 반복 시 윤년 2월 29일에서 비윤년 2월로 계산하면 2월 28일이어야 한다', () => {
    const startDate = new Date(2024, 1, 29); // 2024년 2월 29일 (윤년)
    const result = calculateNextRepeatDate(startDate, 'monthly', 12);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // 2월
    expect(result.getDate()).toBe(28); // 2025년 2월은 28일까지
  });

  it('매년 반복 시 윤년 2월 29일에서 비윤년으로 계산하면 2월 28일이어야 한다', () => {
    const startDate = new Date(2024, 1, 29); // 2024년 2월 29일 (윤년)
    const result = calculateNextRepeatDate(startDate, 'yearly', 1);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // 2월
    expect(result.getDate()).toBe(28); // 2025년 2월은 28일까지
  });
});
