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

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<EventForm, 'repeat' | 'notificationTime'> &
    Partial<Pick<Event, 'repeat' | 'notificationTime'>>
) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;
  const repeatCheckbox = screen.getByLabelText('반복 설정') as HTMLInputElement;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  // 반복 일정이 아닌 경우 반복 일정 체크 해제
  if (repeatCheckbox.checked && repeat?.type === 'none') {
    await user.click(repeatCheckbox);
  }

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
      repeat: { type: 'none', interval: 0 },
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
      repeat: { type: 'none', interval: 0 },
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
      repeat: { type: 'none', interval: 0 },
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

describe('반복 일정 표시', () => {
  it('반복 일정의 경우 반복 아이콘이 일정 제목 앞에 존재한다.', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '반복 테스트',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 0 },
        notificationTime: 10,
      },
    ]);

    setup(<App />);

    const eventList = await screen.findByTestId('event-list');
    const repeatIcon = await screen.findByTestId('repeat-icon');

    expect(eventList).toHaveTextContent('반복 테스트');
    expect(eventList).toHaveTextContent('반복일정');
    expect(repeatIcon).toBeInTheDocument();
  });
});

describe('반복 종료', () => {
  it('종료일 선택하면 날짜 입력 필드가 표시된다', async () => {
    const { user } = setup(<App />);

    const select = screen.getByRole('combobox', { name: '반복 종료' });

    await user.selectOptions(select, 'endDate');

    const dateInput = screen.getByTestId('repeat-end-date');
    const countInput = screen.queryByTestId('repeat-end-count');

    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');

    expect(countInput).not.toBeInTheDocument();
  });

  it('종료 횟수 선택하면 횟수 입력 필드가 표시된다', async () => {
    const { user } = setup(<App />);

    const select = screen.getByRole('combobox', { name: '반복 종료' });

    await user.selectOptions(select, 'endCount');

    const dateInput = screen.queryByTestId('repeat-end-date');
    const countInput = screen.getByTestId('repeat-end-count');

    expect(dateInput).not.toBeInTheDocument();

    expect(countInput).toBeInTheDocument();
    expect(countInput).toHaveAttribute('type', 'number');
  });

  it('반복을 종료 없음으로 지정할 수 있다.', async () => {
    vi.setSystemTime(new Date('2025-10-31'));
    setupMockHandlerCreation([
      {
        id: '1',
        title: '무한 반복',
        date: '2025-10-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '무한 반복 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 현재 날짜로 확인
    await user.type(screen.getByLabelText('날짜'), '2025-10-31');
    const currentList = within(screen.getByTestId('event-list'));
    expect(currentList.getByText('무한 반복')).toBeInTheDocument();

    // 1년 후 날짜로 확인
    await user.type(screen.getByLabelText('날짜'), '2026-10-31');
    const futureList = within(screen.getByTestId('event-list'));
    expect(futureList.getByText('무한 반복')).toBeInTheDocument();
  });
});

describe('반복 일정 단일 수정', () => {
  it('반복일정을 수정하면 단일 일정으로 변경되고 반복 아이콘이 사라진다.', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '수정할 반복 일정',
        date: '2025-10-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '수정할 반복 일정',
        date: '2025-10-27',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[1]);

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');

    await user.click(screen.getByTestId('event-submit-button'));

    await screen.findByText('일정이 수정되었습니다.');

    const eventList = screen.getByTestId('event-list');
    const eventBoxes = within(eventList)
      .getAllByRole('generic')
      .filter(
        (box) => box.textContent?.includes('수정된 회의') || box.textContent?.includes('기존 회의')
      );

    const modifiedEventBox = eventBoxes.find((box) => box.textContent?.includes('수정된 회의'));
    expect(
      within(modifiedEventBox as HTMLElement).queryByTestId('repeat-icon')
    ).not.toBeInTheDocument();
  });
});

describe('반복 일정 단일 삭제', () => {
  it('반복일정을 삭제하면 해당 일정만 삭제한다.', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '삭제할 반복 일정',
        date: '2025-10-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '삭제할 반복 일정',
        date: '2025-10-27',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const deleteButtons = await screen.findAllByLabelText('Delete event');

    await act(async () => {
      await user.click(deleteButtons[1]);
    });

    await waitFor(() => {
      expect(screen.getAllByLabelText('Delete event')).toHaveLength(1);
    });
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

const getDateCellByDay = (container: HTMLElement, day: string) => {
  return Array.from(container.querySelectorAll('td')).find((td) =>
    td.textContent?.trim().startsWith(day)
  );
};

describe('일정 알림 기능', () => {
  it('사용자가 알림 시간을 선택할 수 있다 (1분, 10분, 1시간, 1일 전)', async () => {
    setup(<App />);

    const notificationSelect = screen.getByLabelText('알림 설정') as HTMLSelectElement;

    // 각 옵션을 선택하면 -> 선택값이 noti어쩌고에 반영돼야 함
    const testCases = [
      { label: '1분 전', value: '1' },
      { label: '10분 전', value: '10' },
      { label: '1시간 전', value: '60' },
      { label: '1일 전', value: '1440' },
    ];

    for (const { value } of testCases) {
      await userEvent.selectOptions(notificationSelect, value);
      expect(notificationSelect.value).toBe(value);
    }
  });

  it('알림 시간에 도달하면 캘린더에 아이콘이 추가되고 색상이 변경되어 표시된다.', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-05T13:22:00'));

    const mockEvent: Event = {
      id: 'event-1',
      title: '어린이날 대운동회',
      date: '2025-05-05',
      startTime: '13:30',
      endTime: '16:00',
      description: '초등학교 운동회',
      location: '운동장',
      category: '가족',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    // 알림 체크 타이머가 돌아가게 함 (최소 1초 이상)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const monthView = screen.getByTestId('month-view');
    const cell = getDateCellByDay(monthView, '5');
    expect(cell).toBeDefined();

    // 아이콘이 실제로 나타날 때까지 기다림
    const icon = await within(cell!).findByTestId('bell-icon');
    expect(icon).toBeInTheDocument();

    // 이벤트 텍스트도 확인
    expect(within(cell!).getByText(/어린이날 대운동회/)).toBeInTheDocument();
  });
});
