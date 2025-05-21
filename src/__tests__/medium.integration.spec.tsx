import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event, EventForm } from '../types';

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

// 필수 필드 입력을 위한 헬퍼 함수 추가
async function fillBasicEventForm(user: UserEvent, details: Partial<EventForm> = {}) {
  await user.type(screen.getByLabelText('제목'), details.title || '기본 제목');
  await user.type(screen.getByLabelText('날짜'), details.date || '2025-07-01');
  await user.type(screen.getByLabelText('시작 시간'), details.startTime || '10:00');
  await user.type(screen.getByLabelText('종료 시간'), details.endTime || '11:00');
  if (details.description) await user.type(screen.getByLabelText('설명'), details.description);
  if (details.location) await user.type(screen.getByLabelText('위치'), details.location);
  if (details.category)
    await user.selectOptions(screen.getByLabelText('카테고리'), details.category);
}

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 1,
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: 2,
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2025-10-15 08:49:59'));

  setup(<App />);

  // ! 일정 로딩 완료 후 테스트
  await screen.findByText('일정 로딩 완료!');

  expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
});

describe('반복 일정 기능 통합 테스트', () => {
  // 매 테스트 후에 MSW 핸들러 초기화
  afterEach(() => {
    server.resetHandlers();
  });

  it('매일 반복 설정을 하고 저장하면, 여러 이벤트가 /api/events-list로 전송되어야 한다.', async () => {
    type RepeatingEventsRequest = {
      events: EventForm[];
    };
    let capturedRequestData: RepeatingEventsRequest | null = null;
    let apiCalled = false;
    server.use(
      // `/api/events-list` POST 요청을 모킹합니다.
      http.post('/api/events-list', async ({ request }) => {
        apiCalled = true;
        const jsonData = await request.json();
        capturedRequestData = jsonData as RepeatingEventsRequest;
        const responseEvents = capturedRequestData.events.map((event, index) => ({
          ...event,
          id: `mock-event-${index}-${Date.now()}`, // 실제 ID는 서버에서 생성됨
          repeat: {
            ...event.repeat,
            id: event.repeat.id || `mock-repeat-group-${Date.now()}`, // 실제 repeat.id는 서버 또는 생성 로직에서 관리
          },
        }));
        return HttpResponse.json(responseEvents, { status: 201 });
      })
    );

    const { user } = setup(<App />);

    // 기본 이벤트 정보 입력
    await fillBasicEventForm(user, {
      title: '매일 아침 조깅',
      date: '2025-07-01', // 시작일
    });

    // 반복 설정 체크
    await act(async () => {
      await user.click(screen.getByLabelText('반복 일정'));
    });

    // 반복 유형: 매일, 간격: 1, 종료일: 2025-07-03
    await act(async () => {
      await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');
    });
    // 간격은 기본값 1을 사용한다고 가정 (UI에 따라 입력 필요할 수 있음)
    // await user.type(screen.getByLabelText('반복 간격'), '1');
    await act(async () => {
      await user.type(screen.getByLabelText('반복 종료일'), '2025-07-03');
    });

    // 저장 버튼 클릭
    await act(async () => {
      await user.click(screen.getByTestId('event-submit-button'));
    });

    // API가 호출되었는지, 그리고 전송된 데이터가 올바른지 검증
    await waitFor(() => {
      expect(apiCalled).toBe(true); // App.tsx가 /api/events-list로 보내도록 수정 필요
    });

    expect(capturedRequestData).not.toBeNull();

    const events = capturedRequestData!.events;

    if (events) {
      expect(events).toHaveLength(3);

      expect(events[0].date).toBe('2025-07-01');
      expect(events[0].repeat.type).toBe('daily');
      expect(events[0].repeat.interval).toBe(1);
      expect(events[0].repeat.endDate).toBe('2025-07-03');

      expect(events[1].date).toBe('2025-07-02');
      expect(events[2].date).toBe('2025-07-03');

      // 모든 생성된 이벤트가 동일한 repeat.id를 공유하는지 확인 (새로운 훅 또는 App.tsx에서 할당 필요)
      // 이 부분은 실제 구현에서 repeatGroupId가 어떻게 관리되는지에 따라 달라집니다.
      // generateRepeatingEvents 유틸은 repeatGroupId를 인자로 받습니다.
      const expectedRepeatGroupId = events[0].repeat.id;
      expect(expectedRepeatGroupId).toBeDefined();
      expect(events[1].repeat.id).toBe(expectedRepeatGroupId);
      expect(events[2].repeat.id).toBe(expectedRepeatGroupId);
    }
  });

  it('반복 간격을 3으로 설정하면 API 요청에 3이 반영되어야 한다', async () => {
    // 테스트 설정 및 MSW 핸들러 코드

    let capturedRequestData = null;
    let apiCalled = false;
    server.use(
      http.post('/api/events-list', async ({ request }) => {
        apiCalled = true;
        const jsonData = await request.json();
        capturedRequestData = jsonData;
        // 응답 생성 코드
        return HttpResponse.json(/* ... */);
      })
    );

    const { user } = setup(<App />);

    // 기본 이벤트 정보 입력
    await fillBasicEventForm(user, {
      title: '반복 간격 테스트',
      date: '2025-07-01',
    });

    // 반복 설정 체크 및 간격 설정
    await act(async () => {
      await user.click(screen.getByLabelText('반복 일정'));
      await user.selectOptions(screen.getByLabelText('반복 유형'), 'weekly');

      // 반복 간격 입력 (3주마다)
      const intervalInput = screen.getByLabelText('반복 간격');
      await user.clear(intervalInput);
      await waitFor(() => expect(intervalInput).toHaveValue(0));
      await user.type(intervalInput, '3');
      await waitFor(() => expect(intervalInput).toHaveValue(3));

      await user.type(screen.getByLabelText('반복 종료일'), '2025-08-15');
    });

    // 저장 버튼 클릭
    await act(async () => {
      await user.click(screen.getByTestId('event-submit-button'));
    });

    // API가 호출되었는지, 그리고 전송된 데이터가 올바른지 검증
    await waitFor(() => {
      expect(apiCalled).toBe(true);
    });

    expect(capturedRequestData).not.toBeNull();
    const events = capturedRequestData!.events;

    // 이벤트들이 모두 동일한 간격 값(3)을 가지고 있는지 확인
    expect(events.every((event: EventForm) => event.repeat.interval === 3)).toBe(true);

    // 3주마다 반복되므로 7/1, 7/22, 8/12 = 총 3개 이벤트
    expect(events).toHaveLength(3);
    expect(events[0].date).toBe('2025-07-01');
    expect(events[1].date).toBe('2025-07-22');
    expect(events[2].date).toBe('2025-08-12');
  });
});
describe('반복 일정 표시', () => {
  it('캘린더에 반복 일정은 반복 아이콘을, 일반 일정은 아이콘 없이 표시해야 한다', async () => {
    const mockEvents: Event[] = [
      // 타입을 Event로 명시
      {
        id: 'event-repeat-1',
        title: '매일 아침 조깅',
        date: '2025-07-15',
        startTime: '07:00',
        endTime: '08:00',
        description: '공원에서 조깅',
        location: '중앙 공원',
        category: '운동',
        repeat: { type: 'daily', interval: 1, endDate: '2025-07-31', id: 'group1' },
        notificationTime: 10, // notificationTime 필드 추가
      },
      {
        id: 'event-single-1',
        title: '치과 예약',
        date: '2025-07-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '정기 검진 및 스케일링',
        location: '서울치과',
        category: '건강',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 30,
      },
    ];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      })
    );

    const { user } = setup(<App />);

    // 1. 캘린더를 2025년 7월로 이동
    // 기본 설정이 2025년 10월이므로, "이전" 버튼을 3번 클릭합니다.
    const prevButton = screen.getByLabelText('Previous');
    await user.click(prevButton); // 9월
    await user.click(prevButton); // 8월
    await user.click(prevButton); // 7월

    // 2. 월 표시가 "2025년 7월"로 변경되었는지 확인
    await waitFor(() => expect(screen.getByText(/2025년 7월/i)).toBeInTheDocument());

    // 3. 특정 날짜(15일)의 셀을 찾습니다.
    // getByText로 날짜 '15'를 찾고, 그 부모 td를 찾습니다.
    const dayCells = await screen.findAllByText('15');
    const dayCell15 = dayCells.find(
      (cell) => cell.closest('td') !== null && within(cell.closest('td')!).getByText('15') === cell
    );

    if (!dayCell15) throw new Error('15일 날짜 셀을 찾을 수 없습니다.');
    const dayCellContainer = dayCell15.closest('td');
    if (!dayCellContainer) throw new Error('15일 날짜 셀의 부모 td를 찾을 수 없습니다.');

    // 4. 반복 일정의 아이콘 확인
    const repeatingEventBox = within(dayCellContainer).getByTestId(`event-${mockEvents[0].id}`);
    expect(
      within(repeatingEventBox).getByTestId(`repeat-indicator-${mockEvents[0].id}`)
    ).toBeInTheDocument();
    expect(within(repeatingEventBox).getByText(mockEvents[0].title)).toBeInTheDocument();

    // 5. 일반 일정에는 아이콘이 없는지 확인
    const singleEventBox = within(dayCellContainer).getByTestId(`event-${mockEvents[1].id}`);
    expect(
      within(singleEventBox).queryByTestId(`repeat-indicator-${mockEvents[1].id}`)
    ).not.toBeInTheDocument();
    expect(within(singleEventBox).getByText(mockEvents[1].title)).toBeInTheDocument();
  });
});
