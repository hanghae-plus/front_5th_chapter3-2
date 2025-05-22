import { Event } from '../../types';
import { validateRepeatEndDate } from '../../utils/validate';

describe('반복 종료일 유효성 검사', () => {
  it('종료일이 시작일보다 빠르면 에러 메시지를 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-14' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBe('종료일은 시작일보다 늦어야 합니다.');
  });

  it('종료일이 시작일과 같으면 에러 메시지를 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-15' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBe('종료일은 시작일보다 늦어야 합니다.');
  });

  it('종료일이 시작일보다 늦으면 null을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBeNull();
  });

  it('종료일이 없으면 null을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBeNull();
  });
});
