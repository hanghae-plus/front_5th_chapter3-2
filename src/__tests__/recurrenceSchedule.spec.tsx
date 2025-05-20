import { act, renderHook } from '@testing-library/react';

import { setupMockHandlerEventListCreation } from '../__mocks__/handlersUtils';
import { useEventOperations } from '../hooks/useEventOperations';
import { Event, RepeatInfo } from '../types';
import { formatEventTitle } from '../utils/eventUtils';
import {
  generateDailyRepeats,
  generateMonthlyRepeats,
  generateRepeats,
  generateWeeklyRepeats,
  generateYearlyRepeats,
} from '../utils/repeatUtils';

describe('반복 유형 선택', () => {
  it('29일에 매년 반복 신청을 하면 윤년인 해에만 일정이 생성된다.', async () => {
    setupMockHandlerEventListCreation();

    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    const startDate = new Date('2024-02-29');
    const endDate = new Date('2032-12-31');

    const baseEvent = {
      id: '',
      title: '윤년 테스트',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '기타',
      repeat: { type: 'yearly', interval: 1, endDate: '2032-12-31' },
      notificationTime: 10,
    } as Omit<Event, 'date' | 'id'>;

    const events = generateYearlyRepeats(startDate, endDate).map((date) => ({
      ...baseEvent,
      id: '',
      date: date.toISOString().slice(0, 10),
    }));

    for (const event of events) {
      await act(async () => {
        await result.current.saveEvent(event);
      });
    }

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual(['2024-02-29', '2028-02-29', '2032-02-29']);
  });

  it('31일에 매월 반복 신청을 하면 31일이 없는 달은 일정을 생성하지 않는다.', () => {
    const startDate = new Date('2025-1-31');
    const endDate = new Date('2025-06-30');

    const result = generateMonthlyRepeats(startDate, endDate, 1);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual(['2025-01-31', '2025-03-31', '2025-05-31']);
  });
});

describe('반복 간격 설정', () => {
  it('2일마다 반복 주기의 간격을 지정할 수 있다.', () => {
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-05-30');
    const result = generateDailyRepeats(startDate, endDate, 2);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates.length).toBe(6);
  });

  it('2주마다 반복 주기의 간격을 지정할 수 있다.', () => {
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-06-30');

    const result = generateWeeklyRepeats(startDate, endDate, 2);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates.length).toBe(4);
  });

  it('3개월마다 반복 주기의 간격을 선택할 수 있다.', () => {
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-12-30');

    const result = generateMonthlyRepeats(startDate, endDate, 3);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates.length).toBe(3);
  });
});

describe('반복 일정 표시', () => {
  it('반복 일정이면 제목 앞에 🔁이 표시된다.', () => {
    const testEvent = {
      id: '22',
      title: '테스트 반복 일정',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트 설명',
      location: '회의실 B',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 2,
        endDate: '2025-05-30',
      },
      notificationTime: 10,
    } as Event;

    expect(formatEventTitle(testEvent)).toBe('🔁 테스트 반복 일정');
  });

  it('반복 일정이 아니면 제목에 🔁이 표시되지 않는다.', () => {
    const testEvent = {
      id: '11',
      title: '일반 일정',
      date: '2025-05-20',
      startTime: '12:00',
      endTime: '13:00',
      description: '테스트 일정 설명',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 10,
    } as Event;

    expect(formatEventTitle(testEvent)).toBe('일반 일정');
  });
});

describe('반복 종료', () => {
  it('종료 조건이 "특정 날짜"일 경우, 해당 날짜까지만 반복된다.', () => {
    const start = new Date('2025-05-01');
    const repeat = {
      type: 'daily',
      interval: 1,
      endDate: '2025-05-05',
    } as RepeatInfo;

    const result = generateRepeats(start, repeat);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual(['2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05']);
  });

  it('종료 조건이 "반복 횟수"일 경우, 지정된 횟수만큼 반복된다.', () => {
    const start = new Date('2025-05-20');
    const repeat = {
      type: 'daily',
      interval: 2,
      endDate: '2025-05-25',
    } as RepeatInfo;

    const result = generateRepeats(start, repeat);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual(['2025-05-20', '2025-05-22', '2025-05-24']);
  });

  it('종료 조건이 "없음"일 경우, 무한 반복이 가능하다.', () => {
    const start = new Date('2025-05-22');
    const repeat = {
      type: 'daily',
      interval: 1,
    } as RepeatInfo;

    // 테스트에서는 무한 반복을 사용할 수 없으므로 일부만 slice해서 테스트
    const result = generateRepeats(start, repeat);

    const dates = result.slice(0, 10).map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual([
      '2025-05-22',
      '2025-05-23',
      '2025-05-24',
      '2025-05-25',
      '2025-05-26',
      '2025-05-27',
      '2025-05-28',
      '2025-05-29',
      '2025-05-30',
      '2025-05-31',
    ]);
  });
});

// describe('반복 일정 단일 수정', () => {
//   it('반복 일정 체크 해제 시 🔁 아이콘이 사라진다.', () => {
//     render(<EventForm />);

//     const checkbox = screen.getByLabelText(/반복 일정/i);
//     const checkboxWrapper = checkbox.closest('label');

//     console.log('chec', checkbox);

//     // 체크 → 체크 해제
//     fireEvent.click(checkbox); // ON
//     expect(checkboxWrapper).toHaveAttribute('data-checked');

//     fireEvent.click(checkbox); // OFF
//     expect(checkboxWrapper).not.toHaveAttribute('data-checked');
//   });

//   it('반복일정을 수정하면 단일 일정으로 변경된다.', () => {
//     const originalEvent = {
//       id: 'abc',
//       title: '매일 아침 회의',
//       date: '2025-05-22',
//       repeat: {
//         type: 'daily',
//         interval: 1,
//         endDate: '2025-06-22',
//       },
//       isRepeating: true,
//     };

//     const updatedEvent = updateRepeatToNone(originalEvent);

//     expect(updatedEvent.repeat.type).toBe('none');
//     expect(updatedEvent.isRepeating).toBe(false); // UI용 부가 확인
//   });
// });
