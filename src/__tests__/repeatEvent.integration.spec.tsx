import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupRecurringMockHandlerCreation } from '../__mocks__/handlersUtils';
import App from '../App';
import { Event } from '../types';
import { formatMonth, formatWeek } from '../utils/dateUtils';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
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
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
  if (repeat.type !== 'none') {
    const intervalInput = await screen.findByLabelText('반복 간격');

    await user.clear(intervalInput);
    await user.type(intervalInput, repeat.interval.toString());

    if (repeat.endDate) {
      await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate);
    }
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정', () => {
  it('매일 반복 유형으로 일정을 생성하면 다음 날에도 해당 일정이 표시된다', async () => {
    setupRecurringMockHandlerCreation([]);
    setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 반복 이벤트 생성 로직 구현
     * 10-15일로 매일 반복 일정 생성
     */
    // await saveRecurringSchedule(user, {
    //   title: '매일 반복 이벤트',
    //   date: '2025-10-15',
    //   startTime: '10:00',
    //   endTime: '11:00',
    //   description: '매일 반복 이벤트입니다',
    //   location: '어딘가',
    //   category: '기타',
    //   repeat: { type: 'daily', interval: 1 },
    // });
    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText('매일 반복 이벤트')).toBeInTheDocument();

    const nextEvent = monthView.getAllByText('매일 반복 이벤트')?.[1];
    const nextEventDate = nextEvent.closest('td')?.textContent?.split('매일 반복 이벤트')[0];

    expect(nextEventDate).toBe('16');
  });

  it('매주 반복 유형으로 일정을 생성하면 다음 주 같은 요일에도 해당 일정이 표시된다', async () => {
    setupRecurringMockHandlerCreation([]);
    setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 10-15일로 매주 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText('매주 반복 이벤트')).toBeInTheDocument();

    const nextEvent = monthView.getAllByText('매주 반복 이벤트')?.[1];
    const nextEventDate = nextEvent.closest('td')?.textContent?.split('매주 반복 이벤트')[0];

    expect(nextEventDate).toBe('22');
  });

  it('매월 반복 유형으로 일정을 생성하면 다음 달 같은 날짜에도 해당 일정이 표시된다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 10-15일로 매월 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText('매월 반복 이벤트')).toBeInTheDocument();

    const nextMonthButton = screen.getByLabelText('Next');

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));
    const nextEvent = monthView.getByText('매월 반복 이벤트');
    const nextEventDate = nextEvent.closest('td')?.textContent?.split('매월 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2025-11-01')))).toBeInTheDocument();
    expect(nextEventDate).toBe('15');
  });

  it('매년 반복 유형으로 일정을 생성하면 다음 해 같은 날짜에도 해당 일정이 표시된다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 10-15일로 매년 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText('매년 반복 이벤트')).toBeInTheDocument();

    const nextMonthButton = screen.getByLabelText('Next');

    for (let i = 0; i < 12; i++) {
      await user.click(nextMonthButton);
    }

    monthView = within(screen.getByTestId('month-view'));
    const nextEvent = monthView.getByText('매년 반복 이벤트');
    const nextEventDate = nextEvent.closest('td')?.textContent?.split('매년 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2026-10-01')))).toBeInTheDocument();
    expect(nextEventDate).toBe('15');
  });

  it('특정일에 시작하는 2일 간격 반복 일정은 시작일과 이틀 뒤에는 표시되고, 시작일 다음 날에는 표시되지 않는다', async () => {
    setupRecurringMockHandlerCreation([]);
    setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 10-15일로 2일 간격 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText('2일 간격 반복 이벤트')).toBeInTheDocument();

    const nextEvent = monthView.getAllByText('2일 간격 반복 이벤트')?.[1];
    const nextEventDate = nextEvent.closest('td')?.textContent?.split('2일 간격 반복 이벤트')[0];

    expect(nextEventDate).toBe('17');

    const dayCellFor16th = monthView.getByText('16').closest('td');
    const eventOnThe16th = dayCellFor16th?.textContent?.split('16')?.[1];
    expect(eventOnThe16th).toBeUndefined();
  });

  it('특정일에 시작하는 3주 간격 반복 일정은 3주 뒤 해당 요일에는 표시되고, 1주 및 2주 뒤 해당 요일에는 표시되지 않는다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-09-01'));

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 09-01일로 3주 간격, 특정 요일 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    const view = screen.getByLabelText('view');
    await user.selectOptions(view, 'week');

    let weekView = within(screen.getByTestId('week-view'));
    const nextMonthButton = screen.getByLabelText('Next');

    await user.click(nextMonthButton);
    expect(weekView.getByText(formatWeek(new Date('2025-09-01')))).toBeInTheDocument();
    expect(weekView.queryByText('3주 간격 반복 이벤트')).not.toBeInTheDocument();

    await user.click(nextMonthButton);
    expect(weekView.getByText(formatWeek(new Date('2025-09-08')))).toBeInTheDocument();
    expect(weekView.queryByText('3주 간격 반복 이벤트')).not.toBeInTheDocument();

    const event = weekView.getByText('3주 간격 반복 이벤트').closest('td');
    const eventDate = event?.textContent?.split('3주 간격 반복 이벤트')[0];
    expect(new Date(`2025-09-${eventDate}`).getDay()).toEqual(new Date('2025-09-01').getDay());

    await user.click(nextMonthButton);
    expect(weekView.getByText(formatWeek(new Date('2025-09-15')))).toBeInTheDocument();
    expect(weekView.getByText('3주 간격 반복 이벤트')).toBeInTheDocument();
  });

  it('특정일에 시작하는 2개월 간격 반복 일정은 시작월과 2개월 뒤 같은 날짜에는 표시되고, 시작 다음 달 같은 날짜에는 표시되지 않는다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-09-01'));

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 09-15일로 2개월 간격, 특정 요일 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));
    const nextMonthButton = screen.getByLabelText('Next');

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-10-01')))).toBeInTheDocument();
    expect(monthView.queryByText('2개월 간격 반복 이벤트')).not.toBeInTheDocument();

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-11-01')))).toBeInTheDocument();
    expect(monthView.getByText('2개월 간격 반복 이벤트')).toBeInTheDocument();

    const event = monthView.getByText('2개월 간격 반복 이벤트').closest('td');
    const eventDate = event?.textContent?.split('2개월 간격 반복 이벤트')[0];
    expect(eventDate).toBe('15');

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-12-01')))).toBeInTheDocument();
    expect(monthView.queryByText('2개월 간격 반복 이벤트')).not.toBeInTheDocument();
  });

  it('매월 반복으로 1월 31일에 생성한 일정은 3월에는 표시되고, 2월에는 표시되지 않는다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-01-01'));

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 01-31일로 매월 31일 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));
    const eventCellForJanuary = monthView.getByText('31일 반복 이벤트').closest('td');
    const eventDateForJanuary = eventCellForJanuary?.textContent?.split('31일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2025-01-01')))).toBeInTheDocument();
    expect(monthView.getByText('31일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateForJanuary).toBe('31');

    const nextMonthButton = screen.getByLabelText('Next');

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-02-01')))).toBeInTheDocument();
    expect(monthView.queryByText('31일 반복 이벤트')).not.toBeInTheDocument();

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));
    const eventCellForMarch = monthView.getByText('31일 반복 이벤트').closest('td');
    const eventDateForMarch = eventCellForMarch?.textContent?.split('31일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2025-03-01')))).toBeInTheDocument();
    expect(monthView.getByText('31일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateForMarch).toBe('31');
  });

  it('매년 반복으로 2월 29일(윤년)에 생성한 일정은 다음 해가 평년일 경우 표시되지 않는다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2024-02-01'));

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 02-29일로 매년 2월 29일 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));
    const eventCellFor2024 = monthView.getByText('29일 반복 이벤트').closest('td');
    const eventDateFor2024 = eventCellFor2024?.textContent?.split('29일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2024-02-01')))).toBeInTheDocument();
    expect(monthView.getByText('29일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateFor2024).toBe('29');

    const nextMonthButton = screen.getByLabelText('Next');

    for (let i = 0; i < 12; i++) {
      await user.click(nextMonthButton);
    }

    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-02-01')))).toBeInTheDocument();
    expect(monthView.queryByText('29일 반복 이벤트')).not.toBeInTheDocument();
  });

  it('매년 반복으로 2월 29일(윤년)에 생성한 일정은 4년 뒤 윤년에 다시 2월 29일에 표시된다', async () => {
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2020-02-01'));

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 02-29일로 매년 2월 29일 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));
    const eventCellFor2020 = monthView.getByText('29일 반복 이벤트').closest('td');
    const eventDateFor2020 = eventCellFor2020?.textContent?.split('29일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2020-02-01')))).toBeInTheDocument();
    expect(monthView.getByText('29일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateFor2020).toBe('29');

    const nextMonthButton = screen.getByLabelText('Next');

    for (let i = 0; i < 12 * 4; i++) {
      await user.click(nextMonthButton);
    }

    monthView = within(screen.getByTestId('month-view'));
    const eventCellFor2024 = monthView.getByText('29일 반복 이벤트').closest('td');
    const eventDateFor2024 = eventCellFor2024?.textContent?.split('29일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2024-02-01')))).toBeInTheDocument();
    expect(monthView.getByText('29일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateFor2024).toBe('29');
  });

  it('캘린더 뷰에서 반복 일정이 아이콘과 함께 시각적으로 구분되어 표시된다', async () => {
    /**
     * TODO
     * 반복 일정 초기 생성
     */
    const mockEvents = [] as Event[];
    setupRecurringMockHandlerCreation(mockEvents);
    setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const monthView = within(screen.getByTestId('month-view'));
    const eventCell = monthView.getByText('1일 반복 이벤트').closest('td');

    expect(eventCell?.querySelector('svg')).toBeInTheDocument();
  });
  it('반복 종료 조건으로 특정 날짜를 지정하면 해당 날짜 이후에는 일정이 표시되지 않는다 (2025-09-30까지)', async () => {
    setupRecurringMockHandlerCreation([]);
    vi.setSystemTime(new Date('2025-01-01'));
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 01-30일로 09-30일 반복 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    const nextMonthButton = screen.getByLabelText('Next');

    for (let i = 0; i < 8; i++) {
      await user.click(nextMonthButton);
    }

    let monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-09-01')))).toBeInTheDocument();
    expect(monthView.getByText('1일 반복 이벤트')).toBeInTheDocument();

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-10-01')))).toBeInTheDocument();
    expect(monthView.queryByText('1일 반복 이벤트')).not.toBeInTheDocument();
  });

  it('반복 종료 조건으로 특정 횟수를 지정하면 해당 횟수 이후에는 일정이 표시되지 않는다', async () => {
    setupRecurringMockHandlerCreation([]);
    setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    /**
     * TODO
     * 시작일 10-1일로 1일 간격 반복 횟수 2회 일정 생성
     */

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-10-01')))).toBeInTheDocument();
    expect(monthView.getAllByText('1일 간격 반복 이벤트')).toHaveLength(2);

    const eventCellFor3rd = monthView.getByText('3').closest('td');
    const eventTitleFor3rd = eventCellFor3rd?.textContent?.split('1일 간격 반복 이벤트')?.[1];

    expect(eventTitleFor3rd).toBeUndefined();
  });

  it('반복 일정 중 하나를 수정하면 해당 일정만 단일 일정으로 변경되고 반복 아이콘이 사라진다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    /**
     * TODO
     * 시작일 01-01일로 1일 간격 일정 초기 생성
     */
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-01-01')))).toBeInTheDocument();
    expect(monthView.getByText('1일 간격 반복 이벤트')).toBeInTheDocument();

    const editButton = (await screen.findAllByLabelText('Edit event'))[0];

    await user.click(editButton);

    const eventForm = within(screen.getByTestId('event-form'));

    await user.clear(eventForm.getByLabelText('제목'));
    await user.type(eventForm.getByLabelText('제목'), '수정된 일정');

    await user.click(eventForm.getByTestId('event-submit-button'));

    expect(monthView.queryByText('1달 간격 반복 이벤트')).not.toBeInTheDocument();
    expect(monthView.getByText('수정된 일정')).toBeInTheDocument();

    const eventCellFor1st = monthView.getByText('1').closest('td');

    expect(eventCellFor1st?.querySelector('svg')).not.toBeInTheDocument();
  });

  it('반복 일정 중 하나를 삭제하면 해당 특정 날짜의 일정만 삭제되고 다른 반복 발생은 유지된다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    /**
     * TODO
     * 시작일 01-01일로 1일 간격 일정 초기 생성
     */
    setupRecurringMockHandlerCreation([]);
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-01-01')))).toBeInTheDocument();
    expect(monthView.getByText('1일 간격 반복 이벤트')).toBeInTheDocument();

    const deleteButton = (await screen.findAllByLabelText('Delete event'))[0];

    await user.click(deleteButton);

    const eventCellFor1st = monthView.getByText('1').closest('td');
    const eventTitleFor1st = eventCellFor1st?.textContent?.split('1일 간격 반복 이벤트')?.[1];

    expect(eventTitleFor1st).toBeUndefined();

    const eventCellFor2nd = monthView.getByText('2').closest('td');
    const eventTitleFor2nd = eventCellFor2nd?.textContent?.split('1일 간격 반복 이벤트')?.[1];

    expect(eventTitleFor2nd).toBe('1일 간격 반복 이벤트');
    expect(eventCellFor2nd?.querySelector('svg')).toBeInTheDocument();
  });
});
