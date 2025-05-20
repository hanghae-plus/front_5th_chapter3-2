// 반복 유형 선택

import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, fireEvent, waitFor, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupMockHandlerCreation } from '@/__mocks__/handlersUtils';
import ScheduleEventForm from '@/entities/eventForm/ui/ScheduleEventForm';
import { server } from '@/setupTests.ts';
import { useEventOperations } from '@/shared/hooks/useEventOperations';
import { generateRepeatEvents } from '@/shared/lib/generateRepeatEvents';
import { RepeatType, Event, EventForm } from '@/types';

/**
 * 1. **(필수) 반복 유형 선택**
    - 일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.
    - 반복 유형은 다음과 같다: 매일, 매주, 매월, 매년
	  - 만약, 윤년 29일에 또는 31일에 매월 또는 매년 반복일정을 설정한다면 어떻게 처리할까요? 다른 서비스를 참고해보시고 자유롭게 작성해보세요.
 */

describe('반복 유형 선택', () => {
  const mockSetRepeatType = vi.fn();
  const mockSetRepeatInterval = vi.fn();

  vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return {
      ...actual,
      useToast: vi.fn(() => vi.fn()), // ✅ toast 함수 자체를 모킹
    };
  });

  const formState = {
    title: '',
    setTitle: () => {},
    date: '2025-07-01',
    setDate: () => {},
    startTime: '',
    setStartTime: () => {},
    endTime: '',
    setEndTime: () => {},
    handleStartTimeChange: () => {},
    handleEndTimeChange: () => {},
    startTimeError: null,
    endTimeError: null,
    description: '',
    setDescription: () => {},
    location: '',
    setLocation: () => {},
    category: '',
    setCategory: () => {},
    isRepeating: true,
    setIsRepeating: () => {},
    repeatType: 'daily' as RepeatType,
    setRepeatType: mockSetRepeatType, // ✅ mock 연결
    repeatInterval: 1,
    setRepeatInterval: mockSetRepeatInterval, // ✅ mock 연결
    repeatEndDate: '',
    setRepeatEndDate: () => {},
    notificationTime: 10,
    setNotificationTime: () => {},
    editingEvent: null,
  };

  const notificationOptions = [
    { value: 0, label: '알림 없음' },
    { value: 10, label: '10분 전' },
  ];

  beforeEach(() => {
    render(
      <ChakraProvider>
        <ScheduleEventForm
          formState={formState}
          onSubmit={() => {}}
          notificationOptions={notificationOptions}
        />
      </ChakraProvider>
    );
  });
  afterEach(() => {
    server.resetHandlers();
  });

  it('일정 생성 폼에 반복 유형 선택 필드가 렌더링된다', async () => {
    // ✅ 1차: 텍스트 기반 접근
    expect(screen.getByText('반복 일정')).toBeInTheDocument();
    expect(screen.getByText('반복 유형')).toBeInTheDocument();

    // ✅ 2차: test ID 기반 접근
    const checkbox = await screen.findByTestId('repeat-checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('유저가 설정한 반복 주기로 등록되어야 한다.', async () => {
    // 반복 유형 선택 했을때
    // 반복 유형 select 조작
    const select = screen.getByLabelText('반복 유형');
    await userEvent.selectOptions(select, 'monthly');
    expect(mockSetRepeatType).toHaveBeenCalledWith('monthly');

    // 반복 간격 input 조작
    const intervalInput = screen.getByLabelText('반복 간격');
    fireEvent.change(intervalInput, { target: { value: '3' } });
    expect(mockSetRepeatInterval).toHaveBeenCalledWith(3);
  });

  it('반복 주기 설정 후 서버로 POST 요청되고 토스트가 호출된다.', async () => {
    const newEvent: Event = {
      id: '2',
      title: '정기 스크럼',
      date: '2025-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '정기 스크럼 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'weekly', // ✅ 반복 설정 포함
        interval: 3,
        endDate: '2025-12-31',
      },
      notificationTime: 10,
    };
    // 🧩 핸들러 세팅
    server.use(...setupMockHandlerCreation([])); // 초기값 없음

    // 🧪 훅 실행
    const { result } = renderHook(() => useEventOperations(false));

    // 저장
    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    // ✅ 반복 정보 포함된 newEvent가 상태에 포함되어야 함
    expect(result.current.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '2',
          title: '정기 스크럼',
          repeat: expect.objectContaining({
            type: 'weekly',
            interval: 3,
            endDate: '2025-12-31',
          }),
        }),
      ])
    );
  });

  it('반복 유형을 매일로 선택하면, 매일 반복되는 일정이 생성되어야 한다.', async () => {
    const repeatTypeSelect = screen.getByLabelText('반복 유형');
    await userEvent.selectOptions(repeatTypeSelect, 'daily');
    expect(mockSetRepeatType).toHaveBeenCalledWith('daily');
  });

  it('반복 유형을 매주로 선택하면, 매주 반복되는 일정이 생성되어야 한다.', async () => {
    const repeatTypeSelect = screen.getByLabelText('반복 유형');
    await userEvent.selectOptions(repeatTypeSelect, 'weekly');
    expect(mockSetRepeatType).toHaveBeenCalledWith('weekly');
  });

  it('반복 유형을 매월로 선택하면, 매월 반복되는 일정이 생성되어야 한다.', async () => {
    const repeatTypeSelect = screen.getByLabelText('반복 유형');
    await userEvent.selectOptions(repeatTypeSelect, 'monthly');
    expect(mockSetRepeatType).toHaveBeenCalledWith('monthly');
  });

  it('반복 유형을 매년로 선택하면, 매년 반복되는 일정이 생성되어야 한다.', async () => {
    const repeatTypeSelect = screen.getByLabelText('반복 유형');
    await userEvent.selectOptions(repeatTypeSelect, 'yearly');
    expect(mockSetRepeatType).toHaveBeenCalledWith('yearly');
  });

  it('2월 29일에 매년 반복을 설정하면, 윤년이 아닌 해는 2월 28일로 대체된다.', () => {
    const eventForm: EventForm = {
      title: '윤년 반복 테스트',
      date: '2024-02-29', // 윤년
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'yearly',
        interval: 1,
      },
    };

    const events = generateRepeatEvents(eventForm);

    expect(events.map((e: { date: any }) => e.date)).toEqual([
      '2024-02-29', // 윤년
      '2025-02-28', // ❗비윤년 → 보정
      '2026-02-28', // ❗비윤년 → 보정
      '2027-02-28', // ❗비윤년 → 보정
    ]);
  });

  it('1월 31일에 매월 반복을 설정하면, 2월은 말일로 조정된다.', () => {
    const eventForm: EventForm = {
      title: '매월 반복 테스트',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-04-30',
      },
    };

    const events = generateRepeatEvents(eventForm);

    expect(events.map((e) => e.date)).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
    ]);
  });
});

/**
 * 2. **(필수) 반복 간격 설정**
    - 각 반복 유형에 대해 간격을 설정할 수 있다.
    - 예: 2일마다, 3주마다, 2개월마다 등
 */
describe('반복 간격 설정', () => {
  it('daily 반복일 때 간격이 2면 2일마다 생성된다.', () => {
    const eventForm: EventForm = {
      title: '2일 간격 운동',
      date: '2025-07-01',
      startTime: '08:00',
      endTime: '09:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'daily',
        interval: 2,
        count: 3,
      },
    };

    const events = generateRepeatEvents(eventForm);

    expect(events.map((e) => e.date)).toEqual(['2025-07-01', '2025-07-03', '2025-07-05']);
  });

  it('weekly 반복일 때 간격이 2면 2주마다 생성된다.', () => {
    // 날짜: 2025-07-01 → 07-15 → 07-29
    const eventForm: EventForm = {
      title: '2주 간격 운동',
      date: '2025-07-01',
      startTime: '08:00',
      endTime: '09:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'weekly',
        interval: 2,
        count: 3,
      },
    };

    const events = generateRepeatEvents(eventForm);
    expect(events.map((e) => e.date)).toEqual(['2025-07-01', '2025-07-15', '2025-07-29']);
  });

  it('monthly 반복일 때 간격이 2면 2개월마다 생성된다.', () => {
    // 날짜: 2025-07-01 → 09-01 → 11-01
    const eventForm: EventForm = {
      title: '2개월 간격 운동',
      date: '2025-07-01',
      startTime: '08:00',
      endTime: '09:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'monthly',
        interval: 2,
        count: 3,
      },
    };

    const events = generateRepeatEvents(eventForm);
    expect(events.map((e) => e.date)).toEqual(['2025-07-01', '2025-09-01', '2025-11-01']);
  });

  it('yearly 반복일 때 간격이 2면 2년마다 생성된다.', () => {
    // 날짜: 2024-02-29 → 2026-02-28 → 2028-02-29
    const eventForm: EventForm = {
      title: '2년 간격 운동',
      date: '2024-02-29',
      startTime: '08:00',
      endTime: '09:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'yearly',
        interval: 2,
        count: 3,
      },
    };

    const events = generateRepeatEvents(eventForm);

    expect(events.map((e) => e.date)).toEqual([
      '2024-02-29',
      '2026-02-28', // ❗비윤년 → 보정
      '2028-02-29', // ❗비윤년 → 보정
    ]);
  });
});

/**
 * 3. **(필수) 반복 일정 표시**
    - 캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다.
    - 아이콘을 넣든 태그를 넣든 자유롭게 해보세요!
 */
describe('반복 일정 표시', () => {
  it('반복 일정인 경우 캘린더에 반복 아이콘(🔁 등)이 표시된다', () => {
    // calendar cell 내에 반복 아이콘 존재 여부 확인
  });

  it('반복 일정인 경우 캘린더에 표시가 되어야 한다.', () => {});

  it('윤년 반복일정이 캘린더에 표시되어야 한다.', () => {});
});
/**
 * 4. **(필수) 반복 종료**
    - 반복 종료 조건을 지정할 수 있다.
    - 옵션: 특정 날짜까지, 특정 횟수만큼, 또는 종료 없음 (예제 특성상, 2025-09-30까지)
 */
it('반복 횟수(count)를 3으로 설정하면 3개의 일정만 생성된다', () => {
  // count 기준으로 반복 생성 결과 검증
});

it('반복 종료일(endDate) 이전까지만 일정이 생성된다', () => {
  // 2025-09-30 이전까지만 반복됨
});

/**
 * 5. **(필수) 반복 일정 단일 수정**
    - 반복일정을 수정하면 단일 일정으로 변경됩니다.
    - 반복일정 아이콘도 사라집니다.
 */
it('반복 일정 중 하나를 수정하면 해당 일정은 repeat.id가 제거되어 반복에서 분리된다', () => {
  // 수정 후 repeat.id가 사라졌는지 확인
});

/**
 * 6. **(필수)**  **반복 일정 단일 삭제**
    - 반복일정을 삭제하면 해당 일정만 삭제합니다.
 */
it('반복 일정 중 하나만 삭제하면 다른 일정은 유지된다', () => {
  // 삭제 요청 후 나머지 일정이 유지되는지 검증
});
