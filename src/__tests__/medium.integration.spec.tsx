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

describe('반복 일정', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('반복 유형을 매일, 매주, 매월, 매년 중에서 선택할 수 있다', async () => {
    const { user } = setup(<App />);
    await user.click(screen.getByTestId('event-submit-button'));

    const repeatSelect = screen.getByLabelText('반복 유형');

    await user.selectOptions(repeatSelect, '매일');
    expect((repeatSelect as HTMLSelectElement).value).toBe('daily');

    await user.selectOptions(repeatSelect, '매주');
    expect((repeatSelect as HTMLSelectElement).value).toBe('weekly');

    await user.selectOptions(repeatSelect, '매월');
    expect((repeatSelect as HTMLSelectElement).value).toBe('monthly');

    await user.selectOptions(repeatSelect, '매년');
    expect((repeatSelect as HTMLSelectElement).value).toBe('yearly');
  });

  it('간격 설정 (2일마다, 3주마다 등)이 정상 동작한다', async () => {
    const { user } = setup(<App />);
    await user.click(screen.getByTestId('event-submit-button'));

    const repeatIntervalInput = screen.getByLabelText('반복 간격');
    await user.clear(repeatIntervalInput);
    await user.type(repeatIntervalInput, '3');
    expect((repeatIntervalInput as HTMLInputElement).value).toBe('3');
  });

  it('캘린더에서 반복 일정이 아이콘이나 태그 등으로 구분되어 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 0,
      },
    ]);

    setup(<App />);

    // 텍스트로 찾는 대신, 반복 회의가 포함된 이벤트 아이템 전체를 찾음
    const allEventItems = await screen.findAllByTestId('event-item');

    // "반복 회의"라는 텍스트를 포함한 요소만 골라냄
    const targetItem = allEventItems.find((item) => within(item).queryByText('반복 회의'));

    expect(targetItem).toBeTruthy(); // 없으면 테스트 실패

    // repeat-icon이 존재하는지 확인
    expect(within(targetItem!).getByTestId('repeat-icon')).toBeInTheDocument();
  });

  it('반복 종료 조건이 특정 날짜, 횟수 제한, 종료 없음으로 설정 가능하다', async () => {
    const { user } = setup(<App />);
    await user.click(screen.getByTestId('event-submit-button'));

    const untilDateRadio = screen.getByLabelText('날짜까지 반복');
    const countRadio = screen.getByLabelText('횟수 제한 반복');
    const noEndRadio = screen.getByLabelText('종료 없음');

    expect(untilDateRadio).toBeInTheDocument();
    expect(countRadio).toBeInTheDocument();
    expect(noEndRadio).toBeInTheDocument();

    // 날짜까지 반복 선택 → date input 나타나야 함
    await userEvent.click(untilDateRadio);
    expect(screen.getByLabelText(/반복 종료일/)).toBeInTheDocument();

    // 횟수 제한 반복 선택 → number input 나타나야 함
    await userEvent.click(countRadio);
    expect(await screen.findByLabelText('반복 횟수')).toBeInTheDocument();

    // 종료 없음 선택 → 추가 인풋 없어야 함
    await userEvent.click(noEndRadio);
    expect(screen.queryByLabelText(/반복 종료일/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('반복 횟수')).not.toBeInTheDocument();
  });

  it('반복 일정을 단일로 수정하면 반복 아이콘이 사라진다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 0,
      },
    ]);

    setup(<App />);

    // 반복 회의 텍스트를 가진 이벤트 아이템 찾기
    const allEventItems = await screen.findAllByTestId('event-item');
    const targetItem = allEventItems.find((item) => within(item).queryByText('반복 회의'));
    expect(targetItem).toBeTruthy();

    // 반복 아이콘 존재 확인
    expect(within(targetItem!).getByTestId('repeat-icon')).toBeInTheDocument();

    // 수정 버튼 클릭 (aria-label 기반)
    const editIconButton = within(targetItem!).getByLabelText('Edit event');
    await userEvent.click(editIconButton);

    // 반복 체크박스 해제 (이 부분은 UI에서 반복 체크박스가 해제되면 내부적으로 repeat.type을 'none'으로 변경한다고 가정)
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await userEvent.click(repeatCheckbox);

    // 저장 버튼 클릭
    const saveButton = screen.getByRole('button', { name: /일정 수정/i });
    await userEvent.click(saveButton);

    // 업데이트된 이벤트 아이템에서 반복 아이콘이 사라졌는지 확인
    const updatedItems = await screen.findAllByTestId('event-item');
    const updatedItem = updatedItems.find((item) => within(item).queryByText('반복 회의'));
    expect(updatedItem).toBeTruthy();

    // 반복 타입이 'none'이면 아이콘이 사라져야 하므로 queryByTestId는 null을 반환해야 함
    expect(within(updatedItem!).queryByTestId('repeat-icon')).not.toBeInTheDocument();
  });

  it('반복 일정 단일 삭제 시 해당 일정만 삭제된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 0,
      },
      {
        id: '2',
        title: '반복 회의',
        date: '2025-10-16',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 0,
      },
    ]);

    setup(<App />);

    const eventItems = await screen.findAllByTestId('event-item');
    const targetItem = eventItems.find((item) => within(item).queryByText('2025-10-15'));
    expect(targetItem).toBeTruthy();

    const deleteButton = within(targetItem!).getByLabelText('Delete event');
    await userEvent.click(deleteButton);

    // 2025-10-15 일정이 삭제됐는지 확인
    await waitFor(() => {
      expect(screen.queryByText('2025-10-15')).not.toBeInTheDocument();
    });

    // 2025-10-16 일정은 여전히 존재해야 함
    expect(screen.getByText('2025-10-16')).toBeInTheDocument();
  });

  it('단일 일정을 반복 일정으로 수정하면 반복 아이콘이 표시된다', async () => {
    // 초기 Mock 데이터: 단일 이벤트
    setupMockHandlerCreation([
      {
        id: 'single-event-id',
        title: '단일 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '단일로 진행하는 회의',
        location: '회의실 C',
        category: '개인',
        repeat: { type: 'none', interval: 1 }, // 단일 이벤트로 시작
        notificationTime: 0,
      },
    ]);

    const { user } = setup(<App />);

    // 초기 이벤트 로딩 대기
    const allEventItems = await screen.findAllByTestId('event-item');
    const targetItem = allEventItems.find((item) => within(item).queryByText('단일 회의'));
    expect(targetItem).toBeTruthy();

    // 초기에는 반복 아이콘이 없어야 함
    expect(within(targetItem!).queryByTestId('repeat-icon')).not.toBeInTheDocument();

    // 수정 버튼 클릭
    const editIconButton = within(targetItem!).getByLabelText('Edit event');
    await user.click(editIconButton);

    // '반복 일정' 체크박스 클릭하여 활성화
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 반복 유형과 간격 설정 (예: 매일, 2일마다)
    const repeatTypeSelect = screen.getByLabelText('반복 유형');
    await user.selectOptions(repeatTypeSelect, '매일'); // 'daily' 선택
    const repeatIntervalInput = screen.getByLabelText('반복 간격');
    await user.clear(repeatIntervalInput);
    await user.type(repeatIntervalInput, '2'); // '2' 입력

    // 반복 종료 조건 '횟수 제한 반복' 선택 후 횟수 설정 (예: 5회)
    const countRadio = screen.getByLabelText('횟수 제한 반복');
    await user.click(countRadio);
    const repeatCountInput = screen.getByLabelText('반복 횟수');
    await user.clear(repeatCountInput);
    await user.type(repeatCountInput, '5');

    // Mock Handler 업데이트: PUT 요청에 대한 Mock 응답 정의
    // 이 시점에서 setupMockHandlerUpdating을 호출하여,
    // 업데이트된 이벤트(repeat 필드 포함)에 대한 Mock 응답을 제공합니다.
    server.use(
      http.put('/api/events/:id', async ({ request, params }) => {
        const updatedEvent = (await request.json()) as Event;
        // console.log('Mock server received PUT for update:', updatedEvent); // 디버깅용

        // Mock 데이터를 업데이트하여 반복 아이콘이 표시될 수 있도록 설정
        return HttpResponse.json(
          {
            ...updatedEvent,
            id: params.id as string,
            repeat: { type: 'daily', interval: 2, count: 5 }, // 이 부분이 중요!
          },
          { status: 200 }
        );
      }),
      // fetchEvents에 대한 GET Mock도 필요 (업데이트 후 리스트 갱신)
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 'single-event-id',
              title: '단일 회의',
              date: '2025-10-15',
              startTime: '10:00',
              endTime: '11:00',
              description: '단일로 진행하는 회의',
              location: '회의실 C',
              category: '개인',
              repeat: { type: 'daily', interval: 2, count: 5 }, // 업데이트된 반복 정보
              notificationTime: 0,
            },
          ],
        });
      })
    );

    // 저장 버튼 클릭
    const saveButton = screen.getByRole('button', { name: /일정 수정/i });
    await user.click(saveButton);

    // 업데이트된 이벤트 아이템에서 반복 아이콘이 나타났는지 확인
    // waitFor를 사용하여 DOM이 업데이트될 때까지 기다림
    await waitFor(async () => {
      const updatedItems = await screen.findAllByTestId('event-item');
      const updatedItem = updatedItems.find((item) => within(item).queryByText('단일 회의'));
      expect(updatedItem).toBeTruthy();
      expect(within(updatedItem!).getByTestId('repeat-icon')).toBeInTheDocument();
      // 추가적으로 반복 정보 텍스트가 정확한지 확인
      expect(within(updatedItem!).getByText('반복: 2일마다 (총 5회)')).toBeInTheDocument();
    });
  });
});
