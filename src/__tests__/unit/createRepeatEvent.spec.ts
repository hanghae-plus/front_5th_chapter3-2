import { Event } from '../../types';
import { createRepeatEvents } from '../../utils/createRepeatEvents';

describe('반복 일정 등록 테스트(endDate 등록 X / 반복 간격 1)', () => {
  it('매일 반복 이벤트를 등록 시 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
    const event: Event = {
      id: '1',
      title: '매일 회고',
      date: '2025-09-21',
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
    expect(repeatEvents.length).toBe(10);
    expect(repeatEvents[0].date).toBe('2025-09-21');
    expect(repeatEvents[1].date).toBe('2025-09-22');
    expect(repeatEvents[2].date).toBe('2025-09-23');
    expect(repeatEvents[3].date).toBe('2025-09-24');
    expect(repeatEvents[4].date).toBe('2025-09-25');
    expect(repeatEvents[5].date).toBe('2025-09-26');
    expect(repeatEvents[6].date).toBe('2025-09-27');
    expect(repeatEvents[7].date).toBe('2025-09-28');
    expect(repeatEvents[8].date).toBe('2025-09-29');
    expect(repeatEvents[9].date).toBe('2025-09-30');

    // repeat id 동일성 검증
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');
    expect(repeatEvents[9].repeat.id).toBe('repeat-1');
  });

  it('매주 반복 이벤트를 전달받으면 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
    const event: Event = {
      id: '1',
      title: '주간 회의',
      date: '2025-09-10',
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
    expect(repeatEvents.length).toBe(3);
    expect(repeatEvents[0].date).toBe('2025-09-10');
    expect(repeatEvents[1].date).toBe('2025-09-17');
    expect(repeatEvents[2].date).toBe('2025-09-24');

    // repeat id 동일성 검증
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');
    expect(repeatEvents[2].repeat.id).toBe('repeat-1');
  });

  it('매월 반복 이벤트를 등록 시 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
    const event: Event = {
      id: '1',
      title: '관리비 납부',
      date: '2025-08-25',
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
    expect(repeatEvents[0].date).toBe('2025-08-25');
    expect(repeatEvents[1].date).toBe('2025-09-25');

    // repeat id 동일성 검증
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');
    expect(repeatEvents[1].repeat.id).toBe('repeat-1');
  });

  it('매년 반복 이벤트를 등록 시 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
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
    expect(repeatEvents.length).toBe(1); // "2025-09-30"까지가 디폴트라 하나만 등록된다.
    expect(repeatEvents[0].date).toBe('2025-07-06');
  });
});

describe('반복 일정 등록 시 반복 종료를 날짜로 입력할 때', () => {
  it('매일 반복 이벤트를 등록 시 반복 종료 일정을 반영한 이벤트를 생성한다. (endDate: "2025-05-31")', () => {
    const event: Event = {
      id: '1',
      title: '매일 회고',
      date: '2025-05-28',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test',
      location: 'test',
      category: 'test',
      repeat: {
        type: 'daily',
        interval: 1,
        endType: 'date',
        endDate: '2025-05-31',
      },
      notificationTime: 10,
    };

    const repeatEvents = createRepeatEvents(event);
    expect(repeatEvents).toBeDefined();
    expect(repeatEvents.length).toBe(4);
    expect(repeatEvents[0].date).toBe('2025-05-28');
    expect(repeatEvents[1].date).toBe('2025-05-29');
    expect(repeatEvents[2].date).toBe('2025-05-30');
    expect(repeatEvents[3].date).toBe('2025-05-31');

    // repeat id 동일성 검증
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');
    expect(repeatEvents[3].repeat.id).toBe('repeat-1');
  });

  it('매년 반복 이벤트를 등록 시 반복 종료 일정을 반영한 이벤트를 생성한다. (endDate: "2025-07-06")', () => {
    const event: Event = {
      id: '1',
      title: 'test',
      date: '2023-07-06',
      startTime: '10:00',
      endTime: '11:00',
      description: '생일',
      location: 'test',
      category: 'test',
      repeat: {
        type: 'yearly',
        interval: 1,
        endType: 'date',
        endDate: '2027-07-06',
      },
      notificationTime: 10,
    };

    const repeatEvents = createRepeatEvents(event);

    expect(repeatEvents).toBeDefined();
    expect(repeatEvents.length).toBe(3);
    expect(repeatEvents[0].date).toBe('2023-07-06');
    expect(repeatEvents[1].date).toBe('2024-07-06');
    expect(repeatEvents[2].date).toBe('2025-07-06');

    // repeat id 동일성 검증
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');
    expect(repeatEvents[2].repeat.id).toBe('repeat-1');
  });

  describe('반복 일정 등록 시 반복 종료를 횟수로 입력할 때', () => {
    it('매일 반복 이벤트를 등록 시 설정한 횟수만큼 반복 일정을 생성한다.', () => {
      const event: Event = {
        id: '1',
        title: '매일 회고',
        date: '2025-09-21',
        startTime: '10:00',
        endTime: '11:00',
        description: 'test',
        location: 'test',
        category: 'test',
        repeat: {
          type: 'daily',
          interval: 1,
          endType: 'count',
          endCount: 3,
        },
        notificationTime: 10,
      };

      const repeatEvents = createRepeatEvents(event);

      expect(repeatEvents).toBeDefined();
      expect(repeatEvents.length).toBe(3);
      expect(repeatEvents[0].date).toBe('2025-09-21');
      expect(repeatEvents[1].date).toBe('2025-09-22');
      expect(repeatEvents[2].date).toBe('2025-09-23');

      // repeat id 동일성 검증
      expect(repeatEvents[0].repeat.id).toBe('repeat-1');
      expect(repeatEvents[2].repeat.id).toBe('repeat-1');
    });

    it('매주 반복 이벤트를 등록 시 설정한 횟수만큼 반복 일정을 생성한다.', () => {
      const event: Event = {
        id: '1',
        title: '주간 회의',
        date: '2025-09-10',
        startTime: '10:00',
        endTime: '11:00',
        description: 'test',
        location: 'test',
        category: 'test',
        repeat: {
          type: 'weekly',
          interval: 1,
          endType: 'count',
          endCount: 2,
        },
        notificationTime: 10,
      };

      const repeatEvents = createRepeatEvents(event);

      expect(repeatEvents).toBeDefined();
      expect(repeatEvents.length).toBe(2);
      expect(repeatEvents[0].date).toBe('2025-09-10');
      expect(repeatEvents[1].date).toBe('2025-09-17');

      // repeat id 동일성 검증
      expect(repeatEvents[0].repeat.id).toBe('repeat-1');
      expect(repeatEvents[1].repeat.id).toBe('repeat-1');
    });

    it('매월 반복 이벤트를 등록 시 설정한 횟수만큼 반복 일정을 생성한다.', () => {
      const event: Event = {
        id: '1',
        title: '관리비 납부',
        date: '2025-08-25',
        startTime: '10:00',
        endTime: '11:00',
        description: 'test',
        location: 'test',
        category: 'test',
        repeat: {
          type: 'monthly',
          interval: 1,
          endType: 'count',
          endCount: 2,
        },
        notificationTime: 10,
      };

      const repeatEvents = createRepeatEvents(event);

      expect(repeatEvents).toBeDefined();
      expect(repeatEvents.length).toBe(2);
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2025-09-25');

      // repeat id 동일성 검증
      expect(repeatEvents[0].repeat.id).toBe('repeat-1');
      expect(repeatEvents[1].repeat.id).toBe('repeat-1');
    });

    it('매년 반복 이벤트를 등록 시 설정한 횟수만큼 반복 일정을 생성한다.', () => {
      const event: Event = {
        id: '1',
        title: '생일',
        date: '2023-07-06',
        startTime: '10:00',
        endTime: '11:00',
        description: '생일',
        location: 'test',
        category: 'test',
        repeat: {
          type: 'yearly',
          interval: 1,
          endType: 'count',
          endCount: 3,
        },
        notificationTime: 10,
      };

      const repeatEvents = createRepeatEvents(event);

      expect(repeatEvents).toBeDefined();
      expect(repeatEvents.length).toBe(3);
      expect(repeatEvents[0].date).toBe('2023-07-06');
      expect(repeatEvents[1].date).toBe('2024-07-06');
      expect(repeatEvents[2].date).toBe('2025-07-06');

      // repeat id 동일성 검증
      expect(repeatEvents[0].repeat.id).toBe('repeat-1');
      expect(repeatEvents[2].repeat.id).toBe('repeat-1');
    });
  });

  it('매년 반복 이벤트를 등록 시 반복 종료 날짜를 최대 날짜보다 뒤로 설정해도 최대 날짜까지의 반복 일정을 생성한다.', () => {
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
        endType: 'date',
        endDate: '2027-07-06',
      },
      notificationTime: 10,
    };

    const repeatEvents = createRepeatEvents(event);

    expect(repeatEvents).toBeDefined();
    // endDate를 2027로 지정했지만 최대로 보여지는 날짜는 '2025-09-30'이므로 길이는 1로 리턴되어야 한다.
    expect(repeatEvents.length).toBe(1);
    expect(repeatEvents[0].date).toBe('2025-07-06');
  });
});

describe('반복 일정 등록 시 반복 간격 설정을 했을 때', () => {
  it('매일 반복 이벤트를 등록 시 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
    const event: Event = {
      id: '1',
      title: '매일 회고',
      date: '2025-09-21',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test',
      location: 'test',
      category: 'test',
      repeat: {
        type: 'daily',
        interval: 6,
      },
      notificationTime: 10,
    };

    const repeatEvents = createRepeatEvents(event);

    expect(repeatEvents).toBeDefined();
    expect(repeatEvents.length).toBe(2);

    expect(repeatEvents[0].date).toBe('2025-09-21');
    expect(repeatEvents[0].id).toBe('1');
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');

    expect(repeatEvents[1].date).toBe('2025-09-27');
    expect(repeatEvents[1].id).toBe('2');
    expect(repeatEvents[1].repeat.id).toBe('repeat-1');
  });

  it('매주 반복 이벤트를 전달받으면 반복 일정 정보에 맞는 이벤트를 생성한다.', () => {
    const event: Event = {
      id: '1',
      title: '주간 회의',
      date: '2025-08-15',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test',
      location: 'test',
      category: 'test',
      repeat: {
        type: 'weekly',
        interval: 2,
      },
      notificationTime: 10,
    };

    const repeatEvents = createRepeatEvents(event);

    expect(repeatEvents).toBeDefined();
    expect(repeatEvents.length).toBe(4);

    expect(repeatEvents[0].date).toBe('2025-08-15');
    expect(repeatEvents[0].id).toBe('1');
    expect(repeatEvents[0].repeat.id).toBe('repeat-1');

    expect(repeatEvents[1].date).toBe('2025-08-29');
    expect(repeatEvents[1].id).toBe('2');
    expect(repeatEvents[1].repeat.id).toBe('repeat-1');

    expect(repeatEvents[2].date).toBe('2025-09-12');
    expect(repeatEvents[2].id).toBe('3');
    expect(repeatEvents[2].repeat.id).toBe('repeat-1');

    expect(repeatEvents[3].date).toBe('2025-09-26');
    expect(repeatEvents[3].id).toBe('4');
    expect(repeatEvents[3].repeat.id).toBe('repeat-1');
  });
});

describe('특수 날짜 테스트', () => {
  it('윤년 2월 29일 이벤트 생성 시 윤년마다 이벤트가 생성된다.', () => {
    const event: Event = {
      id: '1',
      title: 'test',
      date: '2020-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test',
      location: 'test',
      category: 'test',
      repeat: {
        type: 'yearly',
        interval: 1,
      },
      notificationTime: 10,
    };

    const repeatEvents = createRepeatEvents(event);

    expect(repeatEvents.length).toBe(2);
    expect(repeatEvents[0].date).toBe('2020-02-29');
    expect(repeatEvents[1].date).not.toBe('2021-02-28');
    expect(repeatEvents[1].date).toBe('2024-02-29');
  });

  it('매월 31일 이벤트 생성 시 31일이 존재하는 달에 이벤트가 생성된다.', () => {
    const event: Event = {
      id: '1',
      title: 'test',
      date: '2025-01-31',
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

    expect(repeatEvents.length).toBe(5);
    expect(repeatEvents[0].date).toBe('2025-01-31');
    expect(repeatEvents[1].date).not.toBe('2025-02-29');
    expect(repeatEvents[1].date).toBe('2025-03-31');
    expect(repeatEvents[2].date).not.toBe('2025-04-30');
    expect(repeatEvents[2].date).toBe('2025-05-31');
    expect(repeatEvents[3].date).not.toBe('2025-06-30');
    expect(repeatEvents[3].date).toBe('2025-07-31');
    expect(repeatEvents[4].date).toBe('2025-08-31');
  });
});
