import { ChakraProvider } from '@chakra-ui/react';
import { render, renderHook, screen, within, act } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerRepeat,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { useEventOperations } from '../hooks/useEventOperations';
import { server } from '../setupTests';
import { Event } from '../types';
import { validateRepeatEndDate } from '../utils/validate';

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

const getDateCellByDay = (container: HTMLElement, day: string) => {
  return Array.from(container.querySelectorAll('td')).find((td) =>
    td.textContent?.trim().startsWith(day)
  );
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

describe('반복 유형 선택', () => {
  it('사용자는 일정 생성 시 반복 유형을 선택할 수 있다 (매일, 매주, 매월, 매년)', async () => {
    setupMockHandlerUpdating();
    const { user } = setup(<App />);

    const repeatSelect = screen.getByLabelText('반복 유형');

    await user.selectOptions(repeatSelect, ['daily']);
    expect((repeatSelect as HTMLSelectElement).value).toBe('daily');

    await user.selectOptions(repeatSelect, ['weekly']);
    expect((repeatSelect as HTMLSelectElement).value).toBe('weekly');

    await user.selectOptions(repeatSelect, ['monthly']);
    expect((repeatSelect as HTMLSelectElement).value).toBe('monthly');

    await user.selectOptions(repeatSelect, ['yearly']);
    expect((repeatSelect as HTMLSelectElement).value).toBe('yearly');
  });

  it('매년 반복일정이 2월 29일인 경우, 윤년이 아닌 해엔 3월 1일에 노출된다', async () => {
    vi.setSystemTime(new Date('2025-03-01T00:00:00'));

    const mockEvent: Event = {
      id: 'Event 1',
      title: '내 생일',
      date: '2024-02-29',
      startTime: '13:00',
      endTime: '14:00',
      description: '가족과 함께 생일파티',
      location: '거실',
      category: '가족',
      repeat: {
        type: 'yearly',
        interval: 1,
      },
      notificationTime: 1,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    await act(() => null);

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText(/내 생일/)).toBeInTheDocument();
  });

  it('매월 반복일정이 31일인 경우, 30일 이하의 달에는 다음달로 미루어 조정된다', async () => {
    vi.setSystemTime(new Date('2025-07-01T00:00:00'));

    const mockEvent: Event = {
      id: '1',
      title: '정규 회의 1',
      date: '2025-05-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-07-31',
      },
      notificationTime: 10,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    await act(() => null);

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('2025년 7월')).toBeInTheDocument();
    expect(monthView.getByText(/정규 회의 1/)).toBeInTheDocument();
  });
});

describe('반복 간격 설정', () => {
  it('사용자는 매 2일마다 반복 일정을 설정할 수 있다', async () => {
    vi.setSystemTime(new Date('2025-05-01T00:00:00'));

    const mockEvent: Event = {
      id: 'review',
      title: '코드 리뷰',
      date: '2025-05-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '메인 프로젝트 코드 리뷰',
      location: '회의실 B',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 2,
        endDate: '2025-05-09',
      },
      notificationTime: 10,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    await act(() => null);

    const monthView = screen.getByTestId('month-view');

    const presentDays = ['2', '4', '6', '8'];
    presentDays.forEach((day) => {
      const cell = getDateCellByDay(monthView, day);
      expect(cell).toBeDefined();
      expect(within(cell!).getByText(/코드 리뷰/)).toBeInTheDocument();
    });

    const absentDays = ['1', '10'];
    absentDays.forEach((day) => {
      const cell = getDateCellByDay(monthView, day);
      if (cell) {
        expect(within(cell).queryByText(/코드 리뷰/)).not.toBeInTheDocument();
      }
    });
  });

  it('사용자는 매 3주마다 반복 일정을 설정할 수 있다', async () => {
    vi.setSystemTime(new Date('2025-05-01T00:00:00'));

    const mockEvent: Event = {
      id: 'study',
      title: '스터디 모임',
      date: '2025-05-01',
      startTime: '18:00',
      endTime: '20:00',
      description: '개발자 스터디',
      location: '스터디룸 3',
      category: '개인',
      repeat: {
        type: 'weekly',
        interval: 3,
        endDate: '2025-05-31',
      },
      notificationTime: 30,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    await act(() => null);

    const monthView = screen.getByTestId('month-view');

    const presentDays = ['1', '22'];
    presentDays.forEach((day) => {
      const cell = getDateCellByDay(monthView, day);
      expect(cell).toBeDefined();
      expect(within(cell!).getByText(/스터디 모임/)).toBeInTheDocument();
    });

    const absentDays = ['8', '15', '29'];
    absentDays.forEach((day) => {
      const cell = getDateCellByDay(monthView, day);
      if (cell) {
        expect(within(cell).queryByText(/스터디 모임/)).not.toBeInTheDocument();
      }
    });
  });

  it('사용자는 매 2개월마다 반복 일정을 설정할 수 있다', async () => {
    vi.setSystemTime(new Date('2025-05-01T00:00:00'));

    const mockEvent: Event = {
      id: 'month-event',
      title: '월간 보고',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '팀 월간 실적 보고',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 2,
        endDate: '2025-11-30',
      },
      notificationTime: 15,
    };

    setupMockHandlerCreation([mockEvent]);
    const { user } = setup(<App />);

    await act(() => null);

    const clickNextMonth = async () => {
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
    };

    const assertScheduleExists = (container: HTMLElement, day: string, exists: boolean) => {
      const cell = getDateCellByDay(container, day);
      if (!cell) return expect(exists).toBe(false);
      const found = within(cell).queryByText(/월간 보고/);
      if (exists) {
        expect(found).toBeInTheDocument();
      } else {
        expect(found).not.toBeInTheDocument();
      }
    };

    // 5월: 일정 존재
    const mayView = screen.getByTestId('month-view');
    assertScheduleExists(mayView, '1', true);

    // 6월: 없음
    await clickNextMonth();
    const juneView = screen.getByTestId('month-view');
    assertScheduleExists(juneView, '1', false);

    // 7월: 있음
    await clickNextMonth();
    const julyView = screen.getByTestId('month-view');
    assertScheduleExists(julyView, '1', true);

    // 8월: 없음
    await clickNextMonth();
    const augustView = screen.getByTestId('month-view');
    assertScheduleExists(augustView, '1', false);

    // 9월: 있음
    await clickNextMonth();
    const septemberView = screen.getByTestId('month-view');
    assertScheduleExists(septemberView, '1', true);
  });
});

describe('반복 일정 캘린더 표시', () => {
  it('캘린더 뷰에서 반복 일정에는 반복 아이콘이(🍎) 표시된다', async () => {
    vi.setSystemTime(new Date('2025-05-01T00:00:00'));

    const mockEvent: Event = {
      id: 'event-1',
      title: '반복 회의',
      date: '2025-05-02',
      startTime: '10:00',
      endTime: '11:00',
      description: '정기 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-05',
      },
      notificationTime: 1,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    await act(() => null);

    const monthView = screen.getByTestId('month-view');

    // 반복 일정 날짜 중 하나만 확인
    const cell = getDateCellByDay(monthView, '2');
    expect(cell).toBeDefined();
    expect(within(cell!).getByText(/🍎/)).toBeInTheDocument();
    expect(within(cell!).getByText(/반복 회의/)).toBeInTheDocument();
  });

  it('일반 일정은 반복 아이콘이(🍎) 표시되지 않는다', async () => {
    vi.setSystemTime(new Date('2025-05-01T00:00:00'));

    const mockEvent: Event = {
      id: 'event-2',
      title: '단일 일정',
      date: '2025-05-03',
      startTime: '13:00',
      endTime: '14:00',
      description: '일반 일정입니다',
      location: '세미나실',
      category: '기타',
      repeat: {
        type: 'none',
        interval: 0,
      },
      notificationTime: 1,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    await act(() => null);

    const monthView = screen.getByTestId('month-view');

    const cell = getDateCellByDay(monthView, '3');
    expect(cell).toBeDefined();
    expect(within(cell!).queryByText(/🍎/)).not.toBeInTheDocument();
    expect(within(cell!).getByText(/단일 일정/)).toBeInTheDocument();
  });
});

describe('반복 종료 조건 설정', () => {
  it('사용자는 반복 종료일을 설정할 수 있다', async () => {
    vi.setSystemTime(new Date('2025-05-01T00:00:00'));

    const mockEvent: Event = {
      id: 'event-1',
      title: '종료일 반복 일정',
      date: '2025-05-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-05',
      },
      notificationTime: 0,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);
    await act(() => null);

    const monthView = screen.getByTestId('month-view');

    ['2', '3', '4', '5'].forEach((day) => {
      const cell = getDateCellByDay(monthView, day);
      expect(cell).toBeDefined();
      expect(within(cell!).getByText(/종료일 반복 일정/)).toBeInTheDocument();
    });

    const cell6 = getDateCellByDay(monthView, '6');
    expect(cell6).toBeDefined();
    expect(within(cell6!).queryByText(/종료일 반복 일정/)).not.toBeInTheDocument();
  });

  it('종료 조건이 없음이면 2025-09-30까지만 생성된다', async () => {
    vi.setSystemTime(new Date('2025-09-01T00:00:00'));

    const mockEvent: Event = {
      id: 'event-2',
      title: '무기한 반복 일정',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '무한 반복 테스트',
      location: '회의실 B',
      category: '기타',
      repeat: {
        type: 'daily',
        interval: 1,
      },
      notificationTime: 0,
    };

    setupMockHandlerCreation([mockEvent]);
    const { user } = setup(<App />);

    await act(() => null);

    const getDateCellByDay = (container: HTMLElement, day: string) =>
      Array.from(container.querySelectorAll('td')).find((td) =>
        td.textContent?.trim().startsWith(day)
      );

    const assertScheduleExists = (container: HTMLElement, day: string, exists: boolean) => {
      const cell = getDateCellByDay(container, day);
      if (!cell) return expect(exists).toBe(false);
      const found = within(cell).queryByText(/무기한 반복 일정/);
      if (exists) {
        expect(found).toBeInTheDocument();
      } else {
        expect(found).not.toBeInTheDocument();
      }
    };

    const clickNextMonth = async () => {
      const nextButton = screen.getByRole('button', { name: /next/i });
      await act(async () => {
        await user.click(nextButton);
      });
    };

    // 9월 확인
    const septemberView = screen.getByTestId('month-view');
    assertScheduleExists(septemberView, '30', true);

    // 10월 이동
    await clickNextMonth();
    const octoberView = screen.getByTestId('month-view');
    assertScheduleExists(octoberView, '1', false);
  });
});

describe('반복 일정 단일 수정', () => {
  const mockEvent: Event = {
    id: '1',
    title: '반복 일정',
    date: '2025-05-03',
    startTime: '10:00',
    endTime: '11:00',
    description: '반복 테스트',
    location: '회의실 1',
    category: '업무',
    repeat: {
      type: 'daily',
      interval: 1,
      endDate: '2025-05-05',
    },
    notificationTime: 0,
  };

  it('사용자가 반복 일정 중 하나를 수정하면 해당 일정은 단일 일정으로 변경된다', async () => {
    setupMockHandlerRepeat();

    const { result } = renderHook(() => useEventOperations(true));

    await act(() => Promise.resolve(null));

    const updatedEvent: Event = {
      ...mockEvent,
      title: '수정된 단일 일정',
    };

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].title).toBe('수정된 단일 일정');
    expect(result.current.events[0].repeat.type).toBe('none');
  });
});

describe('반복 일정 단일 삭제', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '반복 일정',
      date: '2025-05-03',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 테스트',
      location: '회의실 1',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-05',
      },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '반복 일정 2',
      date: '2025-05-07',
      startTime: '09:00',
      endTime: '10:00',
      description: '반복 테스트 2',
      location: '회의실 2',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-05-31',
      },
      notificationTime: 0,
    },
  ];

  it('사용자는 반복 일정 중 하나만 삭제할 수 있다', async () => {
    setupMockHandlerRepeat();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    expect(result.current.events).toHaveLength(2);

    await act(async () => {
      await result.current.deleteEvent(mockEvents[0].id, mockEvents[0].repeat.type);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events).toEqual(
      mockEvents.filter((event) => event.id !== mockEvents[0].id)
    );
  });
});

/* 심화 과제 - Team */

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

    for (const { label, value } of testCases) {
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

describe('반복 간격', () => {
  it('반복 간격을 설정하지 않으면 기본값으로 1이 설정되어야 한다.', () => {
    setup(<App />);

    const repeatInterval = screen.getByLabelText('repeat-interval');
    expect(repeatInterval).toHaveValue(1);
  });

  it('반복 간격이 1 미만이라면, 경고 메시지가 표시되어야 한다. (복사 붙여넣기 동작)', async () => {
    const { user } = setup(<App />);
    const repeatInterval = screen.getByLabelText('repeat-interval');

    await user.clear(repeatInterval);
    await user.type(repeatInterval, '0');
    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('반복 간격은 1에서 12 사이의 숫자여야 합니다.')).toBeInTheDocument();
  });

  it('반복 간격이 12 초과라면 경고 메시지가 표시되어야 한다. (복사 붙여넣기 동작)', async () => {
    const { user } = setup(<App />);
    const repeatInterval = screen.getByLabelText('repeat-interval');

    await user.clear(repeatInterval);
    await user.type(repeatInterval, '13');
    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('반복 간격은 1에서 12 사이의 숫자여야 합니다.')).toBeInTheDocument();
  });

  it('반복 간격이 유효한 숫자가 아니라면 경고 메시지가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);
    const repeatInterval = screen.getByLabelText('repeat-interval');

    await user.clear(repeatInterval);
    await user.type(repeatInterval, '0');
    await user.type(repeatInterval, '222');
    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('반복 간격은 1에서 12 사이의 숫자여야 합니다.')).toBeInTheDocument();
  });
});

describe('반복 종료일 유효성 검사', () => {
  it('종료일이 시작일보다 빠르면 에러 메시지를 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-14' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBe('종료일은 시작일보다 늦어야 합니다.');
  });

  it('종료일이 시작일과 같으면 에러 메시지를 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-15' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBe('종료일은 시작일보다 늦어야 합니다.');
  });

  it('종료일이 시작일보다 늦으면 null을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBeNull();
  });

  it('종료일이 없으면 null을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBeNull();
  });
});
