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
import { Event } from '../types';

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

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

describe('반복 설정', () => {
  describe('반복 유형 선택', () => {
    it('일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.', async () => {
      const { user } = setup(<App />);

      const newSchedule = {
        title: '새 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '프로젝트 진행 상황 논의',
        location: '회의실 A',
        category: '업무',
      };
      await saveSchedule(user, newSchedule);

      expect(screen.getByLabelText('반복 유형')).toHaveValue('daily');
    });

    it('반복 유형은 다음과 같다: 매일, 매주, 매월, 매년', async () => {
      const { user } = setup(<App />);

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      const repeatTypeSelect = screen.getByLabelText('반복 유형');
      const repeatTypeOptions = repeatTypeSelect.querySelectorAll('option');
      const repeatTypeOptionTexts = Array.from(repeatTypeOptions).map(
        (option) => option.textContent
      );

      expect(repeatTypeOptionTexts).toContain('매일');
      expect(repeatTypeOptionTexts).toContain('매주');
      expect(repeatTypeOptionTexts).toContain('매월');
      expect(repeatTypeOptionTexts).toContain('매년');
    });
  });

  describe('반복 간격 설정', () => {
    it('각 반복 유형에 대해 간격을 설정할 수 있다. 예: 2일마다, 3주마다, 2개월마다 등', async () => {
      const { user } = setup(<App />);

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      const repeatTypeSelect = screen.getByLabelText('반복 유형');
      await user.click(repeatTypeSelect);

      const repeatIntervalSelect = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelect);
      await user.type(repeatIntervalSelect, '2');
      expect(repeatIntervalSelect).toHaveValue(2);
    });
  });

  describe('반복 일정 표시', () => {
    it('캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다.', async () => {
      vi.setSystemTime(new Date('2025-10-15'));

      setupMockHandlerCreation([
        {
          id: '1',
          title: '반복 일정',
          date: '2025-10-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '반복 일정',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);

      // 캘린더 뷰를 주별 뷰로 변경
      const viewSelectInput = screen.getByLabelText('view');
      await user.selectOptions(viewSelectInput, 'week');

      // 이벤트 리스트에서 반복 일정 아이템 탐색
      const eventListContainer = await screen.findByTestId('event-list');
      const allEventItems = await within(eventListContainer).findAllByTestId('event-item');

      const repeatEventItem = allEventItems.find((item) => item.textContent?.includes('반복 일정'));
      expect(repeatEventItem).toBeTruthy();
      expect(within(repeatEventItem!).getByTestId('repeat-icon')).toBeInTheDocument();
      expect(repeatEventItem!.textContent).toContain('반복: 1일마다');
    });
  });

  describe('반복 종료', () => {
    it('반복 종료 조건을 지정할 수 있다. 옵션: 특정 날짜까지, 특정 횟수만큼, 또는 종료 없음 (예제 특성상, 2025-06-30까지)', async () => {
      const { user } = setup(<App />);

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 1. 반복 종료일 필드에 날짜 입력
      const repeatEndDateInput = screen.getByLabelText('반복 종료일');
      await user.type(repeatEndDateInput, '2025-06-30');

      // 2. 값이 정상적으로 입력되었는지 확인
      expect(repeatEndDateInput).toHaveValue('2025-06-30');
    });
  });

  describe('반복 일정 단일 수정', () => {
    it('반복 일정을 수정하면 단일 일정으로 변경됩니다. 반복일정 아이콘도 사라집니다.', async () => {
      vi.setSystemTime(new Date('2025-10-15'));

      const mockEvents = [
        {
          id: '1',
          title: '반복 일정',
          date: '2025-10-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '반복 일정',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
      ];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.put('/api/events/:id', async ({ params, request }) => {
          const { id } = params;
          const eventIndex = mockEvents.findIndex((event) => event.id === id);

          const isValidEvent = eventIndex !== -1;
          if (!isValidEvent) {
            return HttpResponse.json({}, { status: 404 });
          }

          const requestBody = await request.json();
          const isValidRequestBody = typeof requestBody === 'object' && requestBody !== null;
          if (!isValidRequestBody) {
            return HttpResponse.json({}, { status: 400 });
          }

          // 단일 일정으로 변경
          const updatedEvent = {
            ...mockEvents[eventIndex],
            ...requestBody,
            id: String(id),
            repeat: { type: 'none', interval: 0 },
          };

          mockEvents[eventIndex] = updatedEvent;
          return HttpResponse.json(updatedEvent);
        })
      );

      const { user } = setup(<App />);

      // 1. 반복 일정이 목록에 있는지 확인
      const eventList = await screen.findByTestId('event-list');
      const eventItems = within(eventList).getAllByTestId('event-item');
      const originalEventItem = eventItems.find((item) => item.textContent?.includes('반복 일정'));
      expect(originalEventItem).toBeTruthy();

      // 2. 반복 아이콘이 있는지 확인
      const repeatIcon = within(originalEventItem!).getByTestId('repeat-icon');
      expect(repeatIcon).toBeInTheDocument();

      // 3. 수정된 항목이 목록에 있고, 반복 아이콘은 사라졌는지 확인
      const editButton = within(originalEventItem!).getByLabelText('Edit event');
      await user.click(editButton);

      const newTitle = '수정된 일정';
      const titleInput = screen.getByLabelText('제목');
      await user.clear(titleInput);
      await user.type(titleInput, newTitle);

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        const updatedList = screen.getByTestId('event-list');
        const updatedItems = within(updatedList).getAllByTestId('event-item');

        const updatedItem = updatedItems.find((item) => item.textContent?.includes(newTitle));
        expect(updatedItem).toBeTruthy();

        const updatedRepeatIcon = within(updatedItem!).queryByTestId('repeat-icon');
        expect(updatedRepeatIcon).not.toBeInTheDocument();
      });
    });
  });

  describe('반복 일정 단일 삭제', () => {
    it('반복일정을 삭제하면 해당 일정만 삭제합니다.', async () => {
      setupMockHandlerDeletion();

      const { user } = setup(<App />);

      const eventList = within(screen.getByTestId('event-list'));
      const eventsBeforeDelete = await eventList.findAllByText('삭제할 이벤트');
      expect(eventsBeforeDelete).toHaveLength(1);

      const deleteButton = await screen.findByLabelText('Delete event');
      await user.click(deleteButton);

      await waitFor(() => {
        const eventsAfterDelete = eventList.queryAllByText('삭제할 이벤트');
        expect(eventsAfterDelete).toHaveLength(0);
      });
    });
  });
});
