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

const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
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

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 저장 완료 토스트 대기
    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
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

    // 데이터 로딩 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const editButton = await screen.findByLabelText('Edit event');
    await user.click(editButton);

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    // 수정 완료 토스트 대기
    await waitFor(() => {
      expect(screen.getByText('일정이 수정되었습니다.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    const deleteButton = await screen.findByLabelText('Delete event');
    await user.click(deleteButton);

    // 삭제 완료 토스트 대기
    await waitFor(() => {
      expect(screen.getByText('일정이 삭제되었습니다.')).toBeInTheDocument();
    });

    // 삭제된 항목이 더 이상 존재하지 않는지 확인
    await waitFor(() => {
      expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
    });
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    // 저장 완료 토스트 대기
    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    // 저장 완료 토스트 대기
    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const monthView = screen.getByTestId('month-view');
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

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

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

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    await waitFor(() => {
      expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    });

    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const editButtons = await screen.findAllByLabelText('Edit event');
    const editButton = editButtons[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    });

    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2025-10-15 08:49:59'));

  setup(<App />);

  // 로딩 완료 대기
  await waitFor(() => {
    expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
  });

  expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  await waitFor(() => {
    expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
  });
});

describe('반복 일정 기능 통합 테스트', () => {
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
      http.post('/api/events-list', async ({ request }) => {
        apiCalled = true;
        const jsonData = await request.json();
        capturedRequestData = jsonData as RepeatingEventsRequest;
        const responseEvents = capturedRequestData.events.map((event, index) => ({
          ...event,
          id: `mock-event-${index}-${Date.now()}`,
          repeat: {
            ...event.repeat,
            id: event.repeat.id || `mock-repeat-group-${Date.now()}`,
          },
        }));
        return HttpResponse.json(responseEvents, { status: 201 });
      })
    );

    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    // 기본 이벤트 정보 입력
    await fillBasicEventForm(user, {
      title: '매일 아침 조깅',
      date: '2025-07-01',
    });

    // 반복 설정 체크
    await user.click(screen.getByLabelText('반복 일정'));

    // 반복 유형: 매일
    await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');

    await user.type(screen.getByLabelText('반복 종료일'), '2025-07-03');

    // 저장 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // API가 호출되었는지 대기
    await waitFor(() => {
      expect(apiCalled).toBe(true);
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

      const expectedRepeatGroupId = events[0].repeat.id;
      expect(expectedRepeatGroupId).toBeDefined();
      expect(events[1].repeat.id).toBe(expectedRepeatGroupId);
      expect(events[2].repeat.id).toBe(expectedRepeatGroupId);
    }
  });

  it('반복 간격을 3으로 설정하면 API 요청에 3이 반영되어야 한다', async () => {
    let capturedRequestData = null;
    let apiCalled = false;
    server.use(
      http.post('/api/events-list', async ({ request }) => {
        apiCalled = true;
        const jsonData = (await request.json()) as { events: EventForm[] };
        capturedRequestData = jsonData;

        const responseEvents = jsonData.events.map((event, index) => ({
          ...event,
          id: `mock-id-${index}-${Date.now()}`,
          repeat: {
            ...event.repeat,
            id: event.repeat?.id || `mock-repeat-group-${Date.now()}`,
          },
        }));
        return HttpResponse.json(responseEvents, { status: 201 });
      })
    );

    const { user } = setup(<App />);

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    // 기본 이벤트 정보 입력
    await fillBasicEventForm(user, {
      title: '반복 간격 테스트',
      date: '2025-07-01',
    });

    await act(async () => {
      await user.click(screen.getByLabelText('반복 일정'));
    });
    await waitFor(() => expect(screen.getByLabelText('반복 유형')).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('반복 유형'), 'weekly');

    // 반복 간격 입력 (3주마다)
    const intervalInput = screen.getByLabelText('반복 간격');
    await user.clear(intervalInput);
    await user.type(intervalInput, '3');

    await user.type(screen.getByLabelText('반복 종료일'), '2025-08-15');

    // 저장 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // API가 호출되었는지 대기
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
        notificationTime: 10,
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

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    // 1. 캘린더를 2025년 7월로 이동
    const prevButton = screen.getByLabelText('Previous');
    await user.click(prevButton); // 9월
    await user.click(prevButton); // 8월
    await user.click(prevButton); // 7월

    // 2. 월 표시가 "2025년 7월"로 변경되었는지 확인
    await waitFor(() => expect(screen.getByText(/2025년 7월/i)).toBeInTheDocument());

    // 3. 특정 날짜(15일)의 셀을 찾습니다.
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

describe('반복 종료 조건 통합 테스트', () => {
  let capturedRequestData: any = null;
  let apiCalled = false;

  beforeEach(() => {
    capturedRequestData = null;
    apiCalled = false;
    server.use(
      http.post('/api/events-list', async ({ request }) => {
        apiCalled = true;
        const jsonData = await request.json();
        capturedRequestData = jsonData;
        const responseEvents = capturedRequestData.events.map(
          (event: EventForm, index: number) => ({
            ...event,
            id: `mock-event-${index}-${Date.now()}`,
            repeat: {
              ...event.repeat,
              id: event.repeat.id || `mock-repeat-group-${Date.now()}`,
            },
          })
        );
        return HttpResponse.json(responseEvents, { status: 201 });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  // Helper function to set up basic event form
  async function setupBasicForm(user: UserEvent) {
    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    await fillBasicEventForm(user, {
      title: '반복 일정 테스트',
      date: '2025-07-01',
    });

    // 반복 설정 체크
    await act(async () => {
      await user.click(screen.getByLabelText('반복 일정'));
    });
    // '반복 유형' select가 활성화될 때까지 기다림
    await waitFor(() => expect(screen.getByLabelText('반복 유형')).toBeEnabled());

    // 반복 유형: 매주
    await act(async () => {
      await user.selectOptions(screen.getByLabelText('반복 유형'), 'weekly');
    });

    // 수정: '반복 유형' 선택 후 '종료 조건' 및 관련 필드가 나타날 때까지 기다림
    // '종료 조건'의 기본값은 'date'이고, 따라서 '반복 종료일' 필드가 보여야 함
    await waitFor(() => {
      expect(screen.getByLabelText('종료 조건')).toBeInTheDocument();
      expect(screen.getByLabelText('반복 종료일')).toBeInTheDocument(); // '종료 조건'이 'date'로 기본 설정되었다고 가정
      expect(screen.queryByLabelText('반복 횟수')).not.toBeInTheDocument();
    });
  }

  it('날짜 지정 종료 조건 - 특정 날짜까지 반복 이벤트가 생성되어야 한다', async () => {
    const { user } = setup(<App />);

    // 기본 폼 설정
    await setupBasicForm(user);

    // 종료 조건 - 날짜 지정
    await user.selectOptions(screen.getByLabelText('종료 조건'), 'date');

    // 종료일 설정
    await user.type(screen.getByLabelText('반복 종료일'), '2025-07-29');

    // 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // API 호출 확인
    await waitFor(() => {
      expect(apiCalled).toBe(true);
    });

    // 전송된 데이터 확인
    expect(capturedRequestData).not.toBeNull();
    const events = capturedRequestData.events;

    // 지정된 날짜까지 이벤트가 생성되었는지 확인 (7/1부터 매주 화요일: 7/1, 7/8, 7/15, 7/22, 7/29)
    expect(events).toHaveLength(5);
    expect(events[0].date).toBe('2025-07-01');
    expect(events[4].date).toBe('2025-07-29');

    // 모든 이벤트에 종료일이 설정되었는지 확인
    events.forEach((event: any) => {
      expect(event.repeat.endDate).toBe('2025-07-29');
      expect(event.repeat.maxOccurrences).toBeUndefined();
    });
  });

  it('횟수 지정 종료 조건 - 지정된 횟수만큼 반복 이벤트가 생성되어야 한다', async () => {
    const { user } = setup(<App />);

    // 기본 폼 설정
    await setupBasicForm(user);

    // 종료 조건 - 횟수 지정
    await user.selectOptions(screen.getByLabelText('종료 조건'), 'count');

    // 반복 횟수 설정
    const repeatCountInput = screen.getByLabelText('반복 횟수');
    await user.clear(repeatCountInput);
    await user.type(repeatCountInput, '3');

    // 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // API 호출 확인
    await waitFor(() => {
      expect(apiCalled).toBe(true);
    });

    // 전송된 데이터 확인
    expect(capturedRequestData).not.toBeNull();
    const events = capturedRequestData.events;

    // 3회 반복 이벤트가 생성되었는지 확인
    expect(events).toHaveLength(3);
    expect(events[0].date).toBe('2025-07-01');
    expect(events[1].date).toBe('2025-07-08');
    expect(events[2].date).toBe('2025-07-15');

    // 모든 이벤트에 maxOccurrences가 설정되었는지 확인
    events.forEach((event: any) => {
      expect(event.repeat.maxOccurrences).toBe(3);
      expect(event.repeat.endDate).toBeDefined();
    });
  });

  it('종료 없음 설정 - 기본 종료일까지 이벤트가 생성되어야 한다', async () => {
    const { user } = setup(<App />);

    // 기본 폼 설정
    await setupBasicForm(user);

    // 종료 조건 - 종료 없음
    await user.selectOptions(screen.getByLabelText('종료 조건'), 'never');

    // 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // API 호출 확인
    await waitFor(() => {
      expect(apiCalled).toBe(true);
    });

    // 전송된 데이터 확인
    expect(capturedRequestData).not.toBeNull();
    const events = capturedRequestData.events;

    // 적절한 수의 이벤트가 생성되었는지 확인
    expect(events.length).toBeGreaterThan(0);

    // 모든 이벤트에 기본 종료일이 설정되었는지 확인
    events.forEach((event: any) => {
      expect(event.repeat.endDate).toBe('2025-09-30'); // 기본 종료일
      expect(event.repeat.maxOccurrences).toBeUndefined();
    });
  });

  it('종료 조건 변경 시 관련 입력 필드가 동적으로 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    // 기본 폼 설정
    await setupBasicForm(user);

    // 초기 상태에서는 '날짜 지정'으로 되어 있어 '반복 종료일' 필드가 표시됨
    expect(screen.getByLabelText('반복 종료일')).toBeInTheDocument();
    expect(screen.queryByLabelText('반복 횟수')).not.toBeInTheDocument();

    // 종료 조건을 '횟수 지정'으로 변경
    await user.selectOptions(screen.getByLabelText('종료 조건'), 'count');

    // '반복 횟수' 필드가 표시되고 '반복 종료일' 필드가 사라짐
    expect(screen.queryByLabelText('반복 종료일')).not.toBeInTheDocument();
    expect(screen.getByLabelText('반복 횟수')).toBeInTheDocument();

    // 종료 조건을 '종료 없음'으로 변경
    await user.selectOptions(screen.getByLabelText('종료 조건'), 'never');

    // 두 필드 모두 표시되지 않음
    expect(screen.queryByLabelText('반복 종료일')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('반복 횟수')).not.toBeInTheDocument();
  });

  it('반복 횟수에 0 이하의 값을 입력하면 기본값(10)으로 설정되어야 한다', async () => {
    const { user } = setup(<App />);

    // 기본 폼 설정
    await setupBasicForm(user);

    // 종료 조건 - 횟수 지정
    await user.selectOptions(screen.getByLabelText('종료 조건'), 'count');

    // 반복 횟수에 0 입력
    const repeatCountInput = screen.getByLabelText('반복 횟수');
    await user.clear(repeatCountInput);
    await user.type(repeatCountInput, '0');
    // 포커스 이동으로 onBlur 트리거
    await user.tab();

    // 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // API 호출 확인
    await waitFor(() => {
      expect(apiCalled).toBe(true);
    });

    // 전송된 데이터 확인
    const events = capturedRequestData.events;

    // 기본값인 10개의 이벤트가 생성되었는지 확인
    expect(events.length).toBe(10);
    events.forEach((event: any) => {
      expect(event.repeat.maxOccurrences).toBe(10);
    });
  });
});

describe('반복 일정 단일 수정 통합 테스트', () => {
  const initialRepeatingEventId = 'repeat-event-to-modify-id';
  const initialRepeatGroupId = 'group-xyz';

  let eventsListForTest: Event[];

  const initialEventsSetup: Event[] = [
    {
      id: initialRepeatingEventId,
      title: '주간 정기 회의',
      date: '2025-10-06',
      startTime: '10:00',
      endTime: '11:00',
      description: '매주 월요일 진행되는 정기 회의',
      location: '본사 회의실',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        id: initialRepeatGroupId,
        endDate: '2025-10-27',
      },
      notificationTime: 10,
    },
    {
      id: 'repeat-event-instance-2',
      title: '주간 정기 회의',
      date: '2025-10-13',
      startTime: '10:00',
      endTime: '11:00',
      description: '매주 월요일 진행되는 정기 회의',
      location: '본사 회의실',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        id: initialRepeatGroupId,
        endDate: '2025-10-27',
      },
      notificationTime: 10,
    },
  ];

  let updatedEventPayload: Event | null = null;

  beforeEach(() => {
    updatedEventPayload = null;
    eventsListForTest = JSON.parse(JSON.stringify(initialEventsSetup));

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: eventsListForTest });
      }),
      http.put('/api/events/:id', async ({ request, params }) => {
        const eventId = params.id as string;
        const newEventData = (await request.json()) as Event;
        updatedEventPayload = { ...newEventData, id: eventId };

        const eventIndex = eventsListForTest.findIndex((e) => e.id === eventId);
        if (eventIndex !== -1) {
          eventsListForTest[eventIndex] = updatedEventPayload;
        }

        return HttpResponse.json(updatedEventPayload, { status: 200 });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('반복 일정의 특정 인스턴스를 수정하면 해당 일정만 단일 일정으로 변경되고 반복 아이콘이 사라져야 한다', async () => {
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-01'));

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const eventList = screen.getByTestId('event-list');
    const repeatingEventItems = within(eventList).getAllByText('주간 정기 회의');

    const targetEventDisplay = repeatingEventItems.find((el) =>
      within(el.closest('[data-testid^="event-"]')!).getByText('2025-10-06')
    );
    if (!targetEventDisplay) throw new Error('2025-10-06 대상 일정을 리스트에서 찾을 수 없습니다.');

    const targetEventContainer = targetEventDisplay.closest(
      '[data-testid^="event-"]'
    ) as HTMLElement;

    // 수정 전 반복 아이콘 확인
    expect(
      within(targetEventContainer).getByTestId(`repeat-indicator-${initialRepeatingEventId}`)
    ).toBeInTheDocument();

    const editButton = within(targetEventContainer).getByLabelText('Edit event');
    await user.click(editButton);

    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '변경된 주간 회의 (단일)');

    const submitButton = screen.getByTestId('event-submit-button');
    await user.click(submitButton);

    // API 호출 검증
    await waitFor(() => expect(updatedEventPayload).not.toBeNull());
    expect(updatedEventPayload?.id).toBe(initialRepeatingEventId);
    expect(updatedEventPayload?.title).toBe('변경된 주간 회의 (단일)');
    expect(updatedEventPayload?.repeat.type).toBe('none');
    expect(updatedEventPayload?.repeat.id).toBeUndefined();

    // UI 검증: 수정 완료 토스트 대기
    await waitFor(() => {
      expect(screen.getByText('일정이 수정되었습니다.')).toBeInTheDocument();
    });

    // UI에서 변경된 제목으로 요소를 다시 찾습니다.
    const updatedEventItemContainer = await within(eventList)
      .findByText('변경된 주간 회의 (단일)')
      .then((el) => el.closest('[data-testid^="event-"]') as HTMLElement);

    expect(updatedEventItemContainer).toBeInTheDocument();

    // 수정된 일정에서 반복 아이콘이 사라졌는지 확인
    expect(
      within(updatedEventItemContainer).queryByTestId(`repeat-indicator-${initialRepeatingEventId}`)
    ).not.toBeInTheDocument();

    // 다른 반복 인스턴스는 영향을 받지 않았는지 확인
    const unModifiedEventItems = within(eventList).getAllByText('주간 정기 회의');
    const unModifiedInstanceElement = unModifiedEventItems.find((el) =>
      within(el.closest('[data-testid^="event-"]') as HTMLElement).getByText('2025-10-13')
    );
    if (!unModifiedInstanceElement)
      throw new Error('수정되지 않은 2025-10-13 반복 인스턴스를 찾을 수 없습니다.');

    const unModifiedEventContainer = unModifiedInstanceElement.closest(
      '[data-testid^="event-"]'
    ) as HTMLElement;
    expect(
      within(unModifiedEventContainer).getByTestId('repeat-indicator-repeat-event-instance-2')
    ).toBeInTheDocument();
  });

  it('반복 일정 수정 API 실패 시 적절한 오류 처리를 해야 한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    server.use(
      http.put('/api/events/:id', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-01'));

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const eventList = screen.getByTestId('event-list');
    const allRepeatingEventItems = within(eventList).getAllByText('주간 정기 회의');
    const targetEventDisplay = allRepeatingEventItems.find((el) =>
      within(el.closest('[data-testid^="event-"]')!).getByText('2025-10-06')
    );
    if (!targetEventDisplay) throw new Error('2025-10-06 대상 일정을 리스트에서 찾을 수 없습니다.');

    const targetEventContainer = targetEventDisplay.closest(
      '[data-testid^="event-"]'
    ) as HTMLElement;
    const editButton = within(targetEventContainer).getByLabelText('Edit event');

    await user.click(editButton);

    let titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 회의');

    const submitButton = screen.getByTestId('event-submit-button');
    await user.click(submitButton);

    // API 실패 토스트 메시지 대기
    await waitFor(() => {
      expect(screen.getByText('일정 저장 실패')).toBeInTheDocument();
    });

    // 폼이 리셋되었는지 확인
    titleInput = screen.getByLabelText('제목');
    expect(titleInput).toHaveValue('');

    consoleErrorSpy.mockRestore();
  });

  // 다른 테스트들도 동일한 패턴으로 수정...
});

describe('반복 일정 단일 삭제', () => {
  const repeatGroupId = 'weekly-meeting-group-1';
  const initialRepeatingEvents: Event[] = [
    {
      id: 'repeat-instance-1-id',
      title: '주간 보고 회의',
      date: '2025-10-06',
      startTime: '10:00',
      endTime: '11:00',
      description: '첫 번째 주간 보고 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        id: repeatGroupId,
        endDate: '2025-10-20',
      },
      notificationTime: 10,
    },
    {
      id: 'repeat-instance-2-id',
      title: '주간 보고 회의',
      date: '2025-10-13',
      startTime: '10:00',
      endTime: '11:00',
      description: '두 번째 주간 보고 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        id: repeatGroupId,
        endDate: '2025-10-20',
      },
      notificationTime: 10,
    },
    {
      id: 'repeat-instance-3-id',
      title: '주간 보고 회의',
      date: '2025-10-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '세 번째 주간 보고 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        id: repeatGroupId,
        endDate: '2025-10-20',
      },
      notificationTime: 10,
    },
    {
      id: 'other-event-id',
      title: '다른 단일 일정',
      date: '2025-10-06',
      startTime: '14:00',
      endTime: '15:00',
      description: '이것은 다른 일정입니다',
      location: '사무실',
      category: '개인',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 5,
    },
  ];

  let eventsListForTest: Event[];
  let deletedEventId: string | null = null;

  beforeEach(() => {
    eventsListForTest = JSON.parse(JSON.stringify(initialRepeatingEvents));
    deletedEventId = null;

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: eventsListForTest });
      }),
      http.delete('/api/events/:id', ({ params }) => {
        const eventId = params.id as string;
        deletedEventId = eventId;
        eventsListForTest = eventsListForTest.filter((event) => event.id !== eventId);
        return new HttpResponse(null, { status: 204 });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('반복 일정 중 특정 인스턴스 하나만 삭제되고 다른 인스턴스는 남아있어야 한다.', async () => {
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-01'));

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const eventList = screen.getByTestId('event-list');

    // 삭제 전: 모든 반복 인스턴스와 다른 일정이 표시되는지 확인
    expect(within(eventList).getAllByText('주간 보고 회의')).toHaveLength(3);
    expect(within(eventList).getByText('첫 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('두 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('세 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('다른 단일 일정')).toBeInTheDocument();

    // 2. 삭제할 특정 반복 일정 인스턴스 찾기 (예: 두 번째 인스턴스)
    const eventToDeleteContainer = within(eventList).getByTestId(
      `event-${initialRepeatingEvents[1].id}`
    );
    expect(within(eventToDeleteContainer).getByText('두 번째 주간 보고 회의')).toBeInTheDocument();

    // 해당 인스턴스의 삭제 버튼 클릭
    const deleteButton = within(eventToDeleteContainer).getByLabelText('Delete event');
    await user.click(deleteButton);

    // 3. API 호출 확인
    await waitFor(() => {
      expect(deletedEventId).toBe(initialRepeatingEvents[1].id);
    });

    // 4. UI 변경 확인: 성공 토스트 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정이 삭제되었습니다.')).toBeInTheDocument();
    });

    // 삭제된 일정("두 번째 주간 보고 회의")이 더 이상 표시되지 않는지 확인
    expect(within(eventList).queryByText('두 번째 주간 보고 회의')).not.toBeInTheDocument();

    // 남아있는 반복 인스턴스들("첫 번째", "세 번째")은 여전히 표시되는지 확인
    expect(within(eventList).getByText('첫 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getAllByText('주간 보고 회의')).toHaveLength(2);
    expect(within(eventList).getByText('세 번째 주간 보고 회의')).toBeInTheDocument();

    // 다른 단일 일정은 영향을 받지 않았는지 확인
    expect(within(eventList).getByText('다른 단일 일정')).toBeInTheDocument();
  });

  it('반복 일정 삭제 API 호출 실패 시 오류 토스트가 표시되고 UI는 변경되지 않아야 한다.', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const eventIdToDelete = initialRepeatingEvents[1].id;

    server.use(
      http.delete(`/api/events/${eventIdToDelete}`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-01'));

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
    });

    const eventList = screen.getByTestId('event-list');
    const eventToDeleteContainer = within(eventList).getByTestId(`event-${eventIdToDelete}`);
    const deleteButton = within(eventToDeleteContainer).getByLabelText('Delete event');

    await user.click(deleteButton);

    // 오류 토스트 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정 삭제 실패')).toBeInTheDocument();
    });

    // UI가 변경되지 않았는지 확인 (모든 일정이 그대로 있어야 함)
    expect(within(eventList).getAllByText('주간 보고 회의')).toHaveLength(3);
    expect(within(eventList).getByText('첫 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('두 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('세 번째 주간 보고 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('다른 단일 일정')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
