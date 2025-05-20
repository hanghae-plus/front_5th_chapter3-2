import { Event } from '../../types';
import { createRepeatEvents } from '../../utils/createRepeatEvents';

it('매일 반복 이벤트를 전달받으면 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
  const event: Event = {
    id: '1',
    title: '매일 회고',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: 'test',
    location: 'test',
    category: 'test',
    repeat: {
      type: 'daily',
      interval: 1,
    },
    notificationTime: 10,
  };

  const repeatEvents = createRepeatEvents(event);

  expect(repeatEvents).toBeDefined();
  expect(repeatEvents.length).toBe(2);
  expect(repeatEvents[0].date).toBe('2025-05-20');
  expect(repeatEvents[1].date).toBe('2025-05-21');
});

it('매주 반복 이벤트를 전달받으면 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
  const event: Event = {
    id: '1',
    title: '주간 회의',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: 'test',
    location: 'test',
    category: 'test',
    repeat: {
      type: 'weekly',
      interval: 1,
    },
    notificationTime: 10,
  };

  const repeatEvents = createRepeatEvents(event);

  expect(repeatEvents).toBeDefined();
  expect(repeatEvents.length).toBe(2);
  expect(repeatEvents[0].date).toBe('2025-05-20');
  expect(repeatEvents[1].date).toBe('2025-05-27');
});

it('매월 반복 이벤트를 전달받으면 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
  const event: Event = {
    id: '1',
    title: '관리비 납부',
    date: '2025-05-25',
    startTime: '10:00',
    endTime: '11:00',
    description: 'test',
    location: 'test',
    category: 'test',
    repeat: {
      type: 'monthly',
      interval: 1,
    },
    notificationTime: 10,
  };

  const repeatEvents = createRepeatEvents(event);

  expect(repeatEvents).toBeDefined();
  expect(repeatEvents.length).toBe(2);
  expect(repeatEvents[0].date).toBe('2025-05-25');
  expect(repeatEvents[1].date).toBe('2025-06-25');
});

it('매년 반복 이벤트를 전달받으면 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
  const event: Event = {
    id: '1',
    title: 'test',
    date: '2025-07-06',
    startTime: '10:00',
    endTime: '11:00',
    description: '생일',
    location: 'test',
    category: 'test',
    repeat: {
      type: 'yearly',
      interval: 1,
    },
    notificationTime: 10,
  };

  const repeatEvents = createRepeatEvents(event);

  expect(repeatEvents).toBeDefined();
  expect(repeatEvents.length).toBe(2);
  expect(repeatEvents[0].date).toBe('2025-07-06');
  expect(repeatEvents[1].date).toBe('2026-07-06');
});
