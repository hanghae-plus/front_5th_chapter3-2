import { Event, RepeatType } from '../../types';
import { repeatUtils } from '../../utils/repeatUtils';

const getDate = (events: Event[]) => events.map((event) => event.date);

describe('repeatUtils를 테스트합니다.', () => {
  let initEvent: Event;

  beforeEach(() => {
    initEvent = {
      id: '1',
      title: 'repeat event test',
      date: '2025-01-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: RepeatType.NONE, interval: 0, endDate: '2025-05-01' },
      notificationTime: 10,
    };
  });

  describe('반복 유형 선택', () => {
    it('일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.', () => {
      const repeatEvent: Event = {
        ...initEvent,
        repeat: { type: RepeatType.DAILY, interval: 1, endDate: '2025-05-01' },
      };

      const result = repeatUtils(repeatEvent);

      expect(result[0].repeat).not.toBe('none');
    });

    it('1월 31일로 반복 설정 시 2월에는 28,29일로 설정이 된다.', () => {
      const repeatEvent: Event = {
        ...initEvent,
        date: '2025-01-31',
        repeat: { type: RepeatType.MONTHLY, interval: 1, endDate: '2025-05-01' },
      };

      const result = repeatUtils(repeatEvent);

      expect(getDate(result)).toEqual(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30']);
    });
  });

  describe('반복 간격 설정', () => {
    it('2일 마다 반복되는 daily 일정을 설정한다.', () => {
      const repeatEvent: Event = {
        ...initEvent,
        repeat: { type: RepeatType.DAILY, interval: 2, endDate: '2025-02-10' },
      };
      const reulst = repeatUtils(repeatEvent);

      expect(getDate(reulst)).toEqual([
        '2025-01-01',
        '2025-01-03',
        '2025-01-05',
        '2025-01-07',
        '2025-01-09',
        '2025-01-11',
        '2025-01-13',
        '2025-01-15',
        '2025-01-17',
        '2025-01-19',
        '2025-01-21',
        '2025-01-23',
        '2025-01-25',
        '2025-01-27',
        '2025-01-29',
        '2025-01-31',
        '2025-02-02',
        '2025-02-04',
        '2025-02-06',
        '2025-02-08',
        '2025-02-10',
      ]);
    });
  });

  describe('반복 종료', () => {
    it('지정된 interval 횟수만큼만 반복한다', () => {
      const repeatEvent: Event = {
        ...initEvent,
        repeat: { type: RepeatType.WEEKLY, interval: 2, endDate: '2025-02-10' },
      };
      const reulst = repeatUtils(repeatEvent);

      expect(getDate(reulst)).toEqual(['2025-01-01', '2025-01-15', '2025-01-29']);
    });

    it('시작 날부터 endDate 까지만 반복한다.', () => {
      const repeatEvent: Event = {
        ...initEvent,
        repeat: { type: RepeatType.YEARLY, interval: 1, endDate: '2025-02-10' },
      };
      const reulst = repeatUtils(repeatEvent);

      expect(getDate(reulst)).toEqual(['2025-01-01']);
    });
  });

  describe('반복 일정 단일 수정', () => {
    it('반복 일정을 수정하면 단일 일정으로 변경된다.', () => {
      const editEvent = {
        ...initEvent,
        repeat: { type: RepeatType.YEARLY, interval: 1, endDate: '2025-02-10' },
      };

      expect(editEvent.repeat.type).toBe('yearly');

      const editEvent2 = {
        ...initEvent,
        repeat: { type: RepeatType.NONE, interval: 0, endDate: '2025-02-10' },
      };

      expect(editEvent2.repeat.type).toBe('none');
    });
  });

  describe('반복 일정 단일 삭제', () => {
    it('반복일정을 삭제하면 해당 일정만 삭제한다.', () => {
      const events = [
        initEvent,
        { ...initEvent, repeat: { type: RepeatType.YEARLY, interval: 1, endDate: '2025-12-10' } },
      ];
      expect(events).toHaveLength(2);

      const remainEvent = events.filter((event) => event.repeat.endDate === '2025-12-10');
      expect(remainEvent).toHaveLength(1);
    });
  });
});
