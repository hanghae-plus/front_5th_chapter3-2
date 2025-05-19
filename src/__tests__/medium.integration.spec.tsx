import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act } from '@testing-library/react';
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

const saveRecurringSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime'>
) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);
  await user.click(screen.getByLabelText('반복 설정'));
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
  await user.type(screen.getByLabelText('반복 간격'), repeat.interval.toString());
  if (repeat.endDate) {
    await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate);
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

describe('반복 유형 선택', () => {
  it('일정 생성시 반복 유형을 매일로 선택할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매일'로 선택
    // 4. 일정 저장
    // 5. 저장된 일정이 매일 반복으로 표시되는지 확인
  });

  it('일정 생성시 반복 유형을 매주로 선택할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매주'로 선택
    // 4. 일정 저장
    // 5. 저장된 일정이 매주 반복으로 표시되는지 확인
  });

  it('일정 생성시 반복 유형을 매월로 선택할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매월'로 선택
    // 4. 일정 저장
    // 5. 저장된 일정이 매월 반복으로 표시되는지 확인
  });

  it('일정 생성시 반복 유형을 매년으로 선택할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매년'으로 선택
    // 4. 일정 저장
    // 5. 저장된 일정이 매년 반복으로 표시되는지 확인
  });

  it('윤년 29일에 반복 일정을 설정하는 경우, 해당 날짜(29일)가 있는 경우만 반복한다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 날짜를 2024-02-29(윤년)로 설정
    // 3. 반복 체크박스 활성화
    // 4. 반복 유형을 '매월'로 선택
    // 5. 일정 저장
    // 6. 2024-03-29, 2024-04-29 등에만 일정이 표시되는지 확인
    // 7. 2024-03-30, 2024-04-30 등에는 일정이 표시되지 않는지 확인
  });

  it('31일에 매달 반복일정을 설정한다면 해당 날짜(31일)가 있는 경우만 반복한다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 날짜를 2024-01-31로 설정
    // 3. 반복 체크박스 활성화
    // 4. 반복 유형을 '매월'로 선택
    // 5. 일정 저장
    // 6. 2024-01-31, 2024-03-31 등에만 일정이 표시되는지 확인
    // 7. 2024-02-29, 2024-04-30 등에는 일정이 표시되지 않는지 확인
  });

  it('수정시 반복 유형이 올바르게 변경된다 (매일 → 매월).', async () => {
    // 1. 매일 반복 일정 생성
    // 2. 해당 일정의 수정 버튼 클릭
    // 3. 반복 유형을 '매월'로 변경
    // 4. 일정 저장
    // 5. 저장된 일정이 매월 반복으로 표시되는지 확인 (수정을 선택한 일자 이후에 대해서만 변경)
  });

  it('일정 생성시 이미 존재하는 일정과 반복 일정이 겹치는 경우 경고가 표시된다.', async () => {
    // 1. 기존 일정 생성 (2025-10-15 09:00-10:00)
    // 2. 새로운 반복 일정 생성 시도 (2025-10-15 09:30-10:30, 매일 반복)
    // 3. 겹침 경고가 표시되는지 확인
  });

  it('일정 수정시 이미 존재하는 일정과 반복 일정이 겹치는 경우 경고가 표시된다.', async () => {
    // 1. 기존 일정 생성 (2025-10-15 09:00-10:00)
    // 2. 반복 일정 생성 (2025-10-16 09:00-10:00, 매일 반복)
    // 3. 반복 일정의 시간을 09:30-10:30으로 수정 시도
    // 4. 겹침 경고가 표시되는지 확인
  });
});

describe('반복 간격 설정', () => {
  it('매일 반복에 대한 간격을 설정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매일'로 선택
    // 4. 반복 간격을 2로 설정
    // 5. 일정 저장
    // 6. 저장된 일정이 2일 간격으로 반복되는지 확인
  });

  it('매주 반복에 대한 간격을 설정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매주'로 선택
    // 4. 반복 간격을 2로 설정
    // 5. 일정 저장
    // 6. 저장된 일정이 2주 간격으로 반복되는지 확인
  });

  it('매월 반복에 대한 간격을 설정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매월'로 선택
    // 4. 반복 간격을 2로 설정
    // 5. 일정 저장
    // 6. 저장된 일정이 2개월 간격으로 반복되는지 확인
  });

  it('매년 반복에 대한 간격을 설정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 유형을 '매년'으로 선택
    // 4. 반복 간격을 2로 설정
    // 5. 일정 저장
    // 6. 저장된 일정이 2년 간격으로 반복되는지 확인
  });
});

describe('반복 일정 표시', () => {
  it('반복 일정의 경우 반복 아이콘이 일정 제목 앞에 존재한다.', async () => {
    // 1. 반복 일정 생성
    // 2. 일정 목록에서 해당 일정의 반복 아이콘 존재 여부 확인
  });
});

describe('반복 종료', () => {
  it('반복 종료 조건을 특정 날짜까지로 지정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 종료일을 2024-12-31로 설정
    // 4. 일정 저장
    // 5. 2024-12-31 이후에는 일정이 표시되지 않는지 확인
  });

  it('반복 종료 조건을 특정 횟수로 지정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 횟수를 3회로 설정
    // 4. 일정 저장
    // 5. 3회 반복 후에는 일정이 표시되지 않는지 확인
  });

  it('반복을 종료 없음으로 지정할 수 있다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 종료일을 설정하지 않음
    // 4. 일정 저장
    // 5. 일정이 계속 반복되는지 확인
  });

  it('반복 종료일이 올바르지 않은 날짜에 대해 Invalid Date를 반환한다.', async () => {
    // 1. 일정 추가 버튼 클릭
    // 2. 반복 체크박스 활성화
    // 3. 반복 종료일을 잘못된 형식(예: 2024-13-45)으로 입력
    // 4. 일정 저장 시도
    // 5. Invalid Date 오류가 발생하는지 확인
  });
});

describe('반복 일정 단일 수정', () => {
  it('반복일정을 수정하면 단일 일정으로 변경되고 반복 아이콘이 사라진다.', async () => {
    // 1. 반복 일정 생성
    // 2. 해당 일정의 수정 버튼 클릭
    // 3. 일정 내용 수정
    // 4. 일정 저장
    // 5. 수정된 일정이 단일 일정으로 변경되었는지 확인
    // 6. 반복 아이콘이 사라졌는지 확인
  });
});

describe('반복 일정 단일 삭제', () => {
  it('반복일정을 삭제하면 해당 일정만 삭제한다.', async () => {
    // 1. 반복 일정 생성
    // 2. 해당 일정의 삭제 버튼 클릭
    // 3. 삭제 확인
    // 4. 해당 일정만 삭제되고 다른 반복 일정은 유지되는지 확인
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
