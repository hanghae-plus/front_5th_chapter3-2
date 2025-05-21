import { Event, EventForm } from '../../types';
import { generateRepeatDates } from '../../utils/repeatUtils';

describe('반복 유형 선택', () => {
  it('일정 생성 시 반복 유형을 선택할 수 있다.(매일) 2025-05-20 매일 반복되는 일정을 생성한다.', () => {
    const newEvent: Event = {
      id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
      title: '팀 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-31' },
      notificationTime: 1,
    };

    const events = generateRepeatDates(newEvent);
    expect(events).toEqual([
      '2025-05-20',
      '2025-05-21',
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

  it('일정 생성 시 반복 유형을 선택할 수 있다.(매월) 2025-05-20 매월 반복되는 일정을 생성한다.', () => {
    const newEvent: Event = {
      id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
      title: '팀 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-09-30' },
      notificationTime: 1,
    };

    const events = generateRepeatDates(newEvent);
    expect(events).toEqual(['2025-05-20', '2025-06-20', '2025-07-20', '2025-08-20', '2025-09-20']);
  });

  it('일정 생성 시 반복 유형을 선택할 수 있다.(매년) 2025-05-20 매년 반복되는 일정을 생성한다.', () => {
    const newEvent: Event = {
      id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
      title: '팀 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2030-09-30' },
      notificationTime: 1,
    };

    const events = generateRepeatDates(newEvent);
    expect(events).toEqual([
      '2025-05-20',
      '2026-05-20',
      '2027-05-20',
      '2028-05-20',
      '2029-05-20',
      '2030-05-20',
    ]);
  });

  it('일정 수정 시 반복 유형을 선택할 수 있다. 2025-05-20 일정 생성 후, 매주 반복되는 일정으로 수정 한다.', () => {
    const newEvent: EventForm = {
      title: '팀 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 1,
    };

    const events = generateRepeatDates(newEvent);
    expect(events).toEqual(['2025-05-20']);
  });
});

describe('반복 간격 설정', () => {
  it('일정 생성 시 반복 유형에 대해 간격을 설정할 수 있다.(2일마다)', () => {
    const newEvent: Event = {
      id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
      title: '팀 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-05-31' },
      notificationTime: 1,
    };

    const events = generateRepeatDates(newEvent);
    expect(events).toEqual([
      '2025-05-20',
      '2025-05-22',
      '2025-05-24',
      '2025-05-26',
      '2025-05-28',
      '2025-05-30',
    ]);
  });
  it('일정 수정 시 반복 유형에 대해 간격을 설정할 수 있다.(3개월마다)', () => {
    const newEvent: Event = {
      id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
      title: '팀 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 3, endDate: '2025-09-30' },
      notificationTime: 1,
    };

    const events = generateRepeatDates(newEvent);
    expect(events).toEqual(['2025-05-20', '2025-08-20']);
  });
});

describe('반복 일정표시, 단일 수정 및 단일 삭제', () => {
  it('반복 일정 표시, 캘린더 뷰에서 반복 일정을 시각적으로 표시한다.', () => {});
  it('반복 종료, 특정 날짜까지, 특정 횟수만큼까지 반복한다.', () => {});
  it('반복 일정 단일 수정, 반복일정을 수정하면 단일 일정으로 변경됩니다.', () => {});
  it('반복 일정 단일 삭제, 반복일정을 삭제하면 해당 일정만 삭헤합니다.', () => {});
});
