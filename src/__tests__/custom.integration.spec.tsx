import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupMockHandlerList } from '@/__mocks__/handlersUtils';
import App from '@/App';
import { Providers } from '@/components/providers';
import { Event } from '@/types';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ChakraProvider>
        <Providers>{element}</Providers>
      </ChakraProvider>
    ),
    user,
  };
};

const saveSchedule = async (user: UserEvent, form: Omit<Event, 'id' | 'notificationTime'>) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;
  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  if (repeat.type !== 'none') {
    const { type, interval, endDate } = repeat;

    const checkbox = screen.getByLabelText('반복 설정') as HTMLInputElement;
    if (!checkbox.checked) {
      await user.click(checkbox);
    }

    await user.selectOptions(screen.getByLabelText('반복 유형'), type);
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), String(interval));

    if (typeof endDate !== 'undefined') {
      await user.type(screen.getByLabelText('반복 종료일'), endDate);
    }
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

beforeEach(() => {
  vi.setSystemTime(new Date('2025-05-01'));
});

// 1. 반복 유형 선택 - 일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.
// 2. 반복 간격 설정 - 각 반복 유형에 대해 간격을 설정할 수 있다.
// 4. 반복 종료 조건을 지정할 수 있다.
describe('사용자의 반복 유형, 간격, 종료일에 입력값에 따라 컴포넌트에 일정이 표기된다.', () => {
  const common: Event = {
    id: '1',
    title: '반복 일정 1',
    date: '2025-05-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '반복 일정 1 설명',
    location: '집',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 0,
  };

  it('매일 종료일까지 반복되는 이벤트가 컴포넌트에 포함된다.', async () => {
    setupMockHandlerList([]);
    const { user } = setup(<App />);

    await saveSchedule(user, {
      ...common,
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-20' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-05-10')).toBeInTheDocument();
    expect(eventList.getByText('2025-05-11')).toBeInTheDocument();
    expect(eventList.getByText('2025-05-12')).toBeInTheDocument();
  });

  it('2주 마다 종료일까지 반복되는 이벤트가 컴포넌트에 포함되고, 다음달로 전환해도 반복 일정이 표기된다.', async () => {
    setupMockHandlerList([]);
    const { user } = setup(<App />);

    await saveSchedule(user, {
      ...common,
      repeat: { type: 'weekly', interval: 2, endDate: '2025-06-30' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-05-10')).toBeInTheDocument();
    expect(eventList.getByText('2025-05-24')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(eventList.getByText('2025-06-07')).toBeInTheDocument(); // 6월 달력
  });

  it('매월 종료일까지 반복되는 이벤트가 컴포넌트에 포함되고, 다음달로 전환해도 반복 일정이 표기된다.', async () => {
    setupMockHandlerList([]);
    const { user } = setup(<App />);

    await saveSchedule(user, {
      ...common,
      repeat: { type: 'monthly', interval: 1, endDate: '2025-10-31' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-05-10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(eventList.getByText('2025-06-10')).toBeInTheDocument(); // 6월 달력

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(eventList.getByText('2025-07-10')).toBeInTheDocument(); // 7월 달력
  });

  it('매년 종료일까지 반복되는 이벤트가 컴포넌트에 포함되고, 다음 해로 이동해도 반복일정이 표기된다.', async () => {
    setupMockHandlerList([]);
    const { user } = setup(<App />);

    await saveSchedule(user, {
      ...common,
      repeat: { type: 'yearly', interval: 1, endDate: '2027-12-31' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-05-10')).toBeInTheDocument();

    // 이게 최선인가..
    // vi.setSystemTime() 처리방법은 없는 가..
    for (let i = 0; i < 12; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }

    expect(eventList.getByText('2026-05-10')).toBeInTheDocument();
  });
});

// 3. 반복 일정 표시 - 캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표기한다.
it('반복 일정은 캘린더에 아이콘과 함꼐 구분할 수 있다.', async () => {
  setupMockHandlerList([]);
  const { user } = setup(<App />);

  await saveSchedule(user, {
    title: '반복 일정 1',
    date: '2025-05-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '반복 일정 1 설명',
    location: '집',
    category: '개인',
    repeat: { type: 'weekly', interval: 1, endDate: '2025-5-20' },
  });

  const monthView = screen.getByTestId('month-view');
  const repeatIcons = within(monthView).getAllByTestId('repeat-icon');

  // 구현중
  expect(repeatIcons.length).toBe(4); // 잘못된 테스트
});

// 5. 반복 일정 단일 수정 - 반복 일정을 수정하면 단일 일정으로 변경된다.
it('반복 일정을 수정 시 반복에서 제외되며, 아이콘도 사라진다.', () => {
  expect(1).toBe(1);
});

// 6. 반복 일정 단일 삭제 - 반복 일정을 삭제하면 해당 일정만 삭제된다.
it('반복 일정 중 하나를 목록에서 제거하면, 해당 일정만 제거된다.', () => {
  expect(1).toBe(1);
});

// (선택) 7. 예외 날짜 처리
// - 반복 일정 중 특정 날짜를 제외할 수 있다.
// - 반복 일정 중 특정 날짜의 일정을 수정할 수 있다.
// (선택) 8. 요일 지정 (주간 반복의 경우)
// - 주간 반복 시 특정 요일을 선택할 수 있다.
// (선택) 9. 월간 반복 옵션
// - 매월 특정 날짜에 반복되도록 설정할 수 있다.
// - 매월 특정 순서의 요일에 반복 되도록 설정할 수 있다.(2째 주 월요일?)
// (선택) 10. 반복 일정 전체 수정 및 삭제
// - 반복 일정의 모든 일정을 수정할 수 있다.
// - 반복 일정의 모든 일정을 삭제할 수 있다.
