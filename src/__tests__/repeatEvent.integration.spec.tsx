import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupRepeatMockHandlerCreation } from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';
import { formatMonth, formatDateToYYYYMMDD } from '../utils/dateUtils';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

const saveRepeatSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime'>
) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  const titleInput = screen.getByLabelText('제목');
  await user.clear(titleInput);
  await user.type(titleInput, title);

  const dateInput = screen.getByLabelText('날짜');
  await user.clear(dateInput);
  await user.type(dateInput, date);

  const startTimeInput = screen.getByLabelText('시작 시간');
  await user.clear(startTimeInput);
  await user.type(startTimeInput, startTime);

  const endTimeInput = screen.getByLabelText('종료 시간');
  await user.clear(endTimeInput);
  await user.type(endTimeInput, endTime);

  const descriptionInput = screen.getByLabelText('설명');
  await user.clear(descriptionInput);
  await user.type(descriptionInput, description);

  const locationInput = screen.getByLabelText('위치');
  await user.clear(locationInput);
  await user.type(locationInput, location);

  await user.selectOptions(screen.getByLabelText('카테고리'), category);
  await user.click(screen.getByLabelText('반복 일정'));
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);

  if (repeat.type !== 'none') {
    const intervalInput = await screen.findByLabelText('반복 간격');
    fireEvent.change(intervalInput, { target: { value: repeat.interval.toString() } });

    if (repeat.endCondition === 'date' && repeat.endDate) {
      await user.selectOptions(screen.getByLabelText('반복 종료 조건'), 'date');
      const endDateInput = await screen.findByLabelText('반복 종료일');
      await user.clear(endDateInput);
      await user.type(endDateInput, repeat.endDate);
    }

    if (repeat.endCondition === 'count' && repeat.endCount) {
      await user.selectOptions(screen.getByLabelText('반복 종료 조건'), 'count');
      const endCountInput = (await screen.findByLabelText('반복 종료 횟수')) as HTMLInputElement;
      fireEvent.change(endCountInput, { target: { value: repeat.endCount.toString() } });
    }
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정', () => {
  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });
  it('매일 반복 유형으로 일정을 생성하면 다음 날에도 해당 일정이 표시된다', async () => {
    setupRepeatMockHandlerCreation([]);
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '매일 반복 이벤트',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '매일 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'daily', interval: 1, endCondition: 'count', endCount: 2 },
    });

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));

    const eventElements = monthView.getAllByText('매일 반복 이벤트');
    expect(eventElements.length).toBe(2);

    const eventCells = eventElements.map((eventEl) => eventEl.closest('td'));
    const uniqueEventCells = [...new Set(eventCells)];
    const eventDates = uniqueEventCells.map((cell) => cell?.getAttribute('data-date'));

    expect(eventDates).toContain('2025-10-15');
    expect(eventDates).toContain('2025-10-16');
  });

  it('매주 반복 유형으로 일정을 생성하면 다음 주 같은 요일에도 해당 일정이 표시된다', async () => {
    setupRepeatMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-15'));

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '매주 반복 이벤트',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '매주 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'weekly', interval: 1, endCondition: 'count', endCount: 2 },
    });

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));
    const eventElements = monthView.getAllByText('매주 반복 이벤트');
    expect(eventElements.length).toBe(2);

    const eventCells = eventElements.map((eventEl) => eventEl.closest('td'));
    const uniqueEventCells = [...new Set(eventCells)];
    const eventDates = uniqueEventCells.map((cell) => cell?.getAttribute('data-date'));

    expect(eventDates).toContain('2025-10-15');
    expect(eventDates).toContain('2025-10-22');
  });

  it('매월 반복 유형으로 일정을 생성하면 다음 달 같은 날짜에도 해당 일정이 표시된다', async () => {
    setupRepeatMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-15'));

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '매월 반복 이벤트',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '매월 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'monthly', interval: 1, endCondition: 'count', endCount: 2 },
    });

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));
    expect(
      monthView
        .getAllByText('매월 반복 이벤트')
        .filter((el) => el.closest('td')?.getAttribute('data-date') === '2025-10-15').length
    ).toBe(1);

    const nextMonthButton = screen.getByLabelText('Next');
    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));
    await waitFor(() => {
      expect(monthView.getByText(formatMonth(new Date('2025-11-01')))).toBeInTheDocument();
    });
    expect(
      monthView
        .getAllByText('매월 반복 이벤트')
        .filter((el) => el.closest('td')?.getAttribute('data-date') === '2025-11-15').length
    ).toBe(1);
  });

  it('매년 반복 유형으로 일정을 생성하면 다음 해 같은 날짜에도 해당 일정이 표시된다', async () => {
    setupRepeatMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-15'));

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '매년 반복 이벤트',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '매년 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'yearly', interval: 1, endCondition: 'count', endCount: 2 },
    });

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));

    expect(
      monthView
        .getAllByText('매년 반복 이벤트')
        .filter((el) => el.closest('td')?.getAttribute('data-date') === '2025-10-15').length
    ).toBe(1);

    const nextMonthButton = screen.getByLabelText('Next');
    for (let i = 0; i < 12; i++) {
      await user.click(nextMonthButton);
    }

    monthView = within(screen.getByTestId('month-view'));
    await waitFor(() => {
      expect(monthView.getByText(formatMonth(new Date('2026-10-01')))).toBeInTheDocument();
    });
    expect(
      monthView
        .getAllByText('매년 반복 이벤트')
        .filter((el) => el.closest('td')?.getAttribute('data-date') === '2026-10-15').length
    ).toBe(1);
  });

  it('특정일에 시작하는 2일 간격 반복 일정은 시작일과 이틀 뒤에는 표시되고, 시작일 다음 날에는 표시되지 않는다', async () => {
    setupRepeatMockHandlerCreation([]);
    const { user } = setup(<App />);
    vi.setSystemTime(new Date('2025-10-15'));

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '2일 간격 반복 이벤트',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '2일 간격 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'daily', interval: 2, endCondition: 'count', endCount: 2 },
    });

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));

    const eventElements = monthView.getAllByText('2일 간격 반복 이벤트');
    expect(eventElements.length).toBe(2);

    const eventDates = eventElements.map((el) => el.closest('td')?.getAttribute('data-date'));
    expect(eventDates).toContain('2025-10-15');
    expect(eventDates).toContain('2025-10-17');

    const dayCellFor16th = monthView.getByText('16').closest('td');
    if (dayCellFor16th) {
      expect(within(dayCellFor16th).queryByText('2일 간격 반복 이벤트')).not.toBeInTheDocument();
    } else {
      throw new Error('16일 날짜 셀을 찾을 수 없습니다.');
    }
  });

  it('특정일에 시작하는 2개월 간격 반복 일정은 시작월과 2개월 뒤 같은 날짜에는 표시되고, 시작 다음 달 같은 날짜에는 표시되지 않는다', async () => {
    setupRepeatMockHandlerCreation([]);
    vi.setSystemTime(new Date('2025-09-01'));
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '2개월 간격 반복 이벤트',
      date: '2025-09-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '2개월 간격 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'monthly', interval: 2, endCondition: 'count', endCount: 2 },
    });

    await screen.findByText('일정이 추가되었습니다.');

    let monthView = within(screen.getByTestId('month-view'));
    let eventElements = monthView.getAllByText('2개월 간격 반복 이벤트');
    expect(eventElements.length).toBe(1);

    let eventCells = eventElements.map((eventEl) => eventEl.closest('td'));
    let eventDates = eventCells.map((cell) => cell?.getAttribute('data-date'));
    expect(eventDates).toContain('2025-09-15');

    const nextMonthButton = screen.getByLabelText('Next');
    await user.click(nextMonthButton);
    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-10-01')))).toBeInTheDocument();

    const dayCellFor15thOct = monthView.getByText('15').closest('td');
    if (dayCellFor15thOct) {
      expect(
        within(dayCellFor15thOct).queryByText('2개월 간격 반복 이벤트')
      ).not.toBeInTheDocument();
    } else {
      throw new Error('10월 15일 날짜 셀을 찾을 수 없습니다.');
    }

    await user.click(nextMonthButton);
    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-11-01')))).toBeInTheDocument();

    eventElements = monthView.getAllByText('2개월 간격 반복 이벤트');
    expect(eventElements.length).toBe(1);

    eventCells = eventElements.map((eventEl) => eventEl.closest('td'));
    eventDates = eventCells.map((cell) => cell?.getAttribute('data-date'));
    expect(eventDates).toContain('2025-11-15');

    await user.click(nextMonthButton);
    monthView = within(screen.getByTestId('month-view'));

    expect(monthView.getByText(formatMonth(new Date('2025-12-01')))).toBeInTheDocument();

    const dayCellFor15thDec = monthView.getByText('15').closest('td');
    if (dayCellFor15thDec) {
      expect(
        within(dayCellFor15thDec).queryByText('2개월 간격 반복 이벤트')
      ).not.toBeInTheDocument();
    } else {
      throw new Error('12월 15일 날짜 셀을 찾을 수 없습니다.');
    }
  });

  it('매월 반복으로 1월 31일에 생성한 일정은 3월에는 표시되고, 2월에는 표시되지 않는다', async () => {
    setupRepeatMockHandlerCreation([]);
    vi.setSystemTime(new Date('2025-01-01'));
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '31일 반복 이벤트',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '31일 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'monthly', interval: 1, endCondition: 'count', endCount: 3 },
    });

    await screen.findByText('일정이 추가되었습니다.');
    const nextMonthButton = screen.getByLabelText('Next');

    let monthView = within(screen.getByTestId('month-view'));
    await waitFor(() =>
      expect(monthView.getByText(formatMonth(new Date('2025-01-01')))).toBeInTheDocument()
    );
    expect(
      monthView
        .getAllByText('31일 반복 이벤트')
        .filter((el) => el.closest('td')?.getAttribute('data-date') === '2025-01-31').length
    ).toBe(1);

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));
    const eventCellForFebruary = monthView.getByText('31일 반복 이벤트').closest('td');
    const eventDateForFebruary = eventCellForFebruary?.textContent?.split('31일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2025-02-01')))).toBeInTheDocument();
    expect(monthView.getByText('31일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateForFebruary).toBe('28');

    await user.click(nextMonthButton);

    monthView = within(screen.getByTestId('month-view'));
    const eventCellForMarch = monthView.getByText('31일 반복 이벤트').closest('td');
    const eventDateForMarch = eventCellForMarch?.textContent?.split('31일 반복 이벤트')[0];

    expect(monthView.getByText(formatMonth(new Date('2025-03-01')))).toBeInTheDocument();
    expect(monthView.getByText('31일 반복 이벤트')).toBeInTheDocument();
    expect(eventDateForMarch).toBe('31');
  });

  it('캘린더 뷰에서 반복 일정이 아이콘과 함께 시각적으로 구분되어 표시된다', async () => {
    const initialDate = formatDateToYYYYMMDD(new Date('2025-10-15'));
    const mockEvents = [
      {
        id: 'event-1',
        title: '1일 반복 이벤트',
        date: initialDate,
        startTime: '10:00',
        endTime: '11:00',
        description: '반복 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'daily', interval: 1, id: 'repeat-id-1' },
        notificationTime: 10,
      },
    ] as Event[];

    setupRepeatMockHandlerCreation(mockEvents);
    setup(<App />);
    vi.setSystemTime(new Date(initialDate));

    await screen.findByText('일정 로딩 완료!');

    const monthView = within(screen.getByTestId('month-view'));
    const eventCell = monthView.getAllByText('1일 반복 이벤트')[0].closest('td');

    expect(eventCell).not.toBeNull();
    if (eventCell) {
      expect(eventCell.querySelector('svg')).toBeInTheDocument();
    }
  });

  it('반복 종료 조건으로 특정 날짜를 지정하면 해당 날짜 이후에는 일정이 표시되지 않는다 (2025-09-30까지)', async () => {
    setupRepeatMockHandlerCreation([]);
    vi.setSystemTime(new Date('2025-01-01'));
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '월간 반복 종료일 지정 이벤트',
      date: '2025-01-30',
      startTime: '10:00',
      endTime: '11:00',
      description: '종료일 있는 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: {
        type: 'monthly',
        interval: 1,
        endCondition: 'date',
        endDate: '2025-09-30',
      },
    });

    await screen.findByText('일정이 추가되었습니다.');
    const nextMonthButton = screen.getByLabelText('Next');

    for (let i = 0; i < 8; i++) {
      await user.click(nextMonthButton);
    }
    let monthView = within(screen.getByTestId('month-view'));
    await waitFor(() =>
      expect(monthView.getByText(formatMonth(new Date('2025-09-01')))).toBeInTheDocument()
    );
    expect(monthView.getByText('월간 반복 종료일 지정 이벤트')).toBeInTheDocument();

    await user.click(nextMonthButton);
    monthView = within(screen.getByTestId('month-view'));
    await waitFor(() =>
      expect(monthView.getByText(formatMonth(new Date('2025-10-01')))).toBeInTheDocument()
    );
    expect(monthView.queryByText('월간 반복 종료일 지정 이벤트')).not.toBeInTheDocument();
  });

  it('반복 종료 조건으로 특정 횟수를 지정하면 해당 횟수 이후에는 일정이 표시되지 않는다', async () => {
    setupRepeatMockHandlerCreation([]);
    vi.setSystemTime(new Date('2025-10-01'));
    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '횟수 제한 반복 이벤트',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '횟수 제한 반복 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: {
        type: 'daily',
        interval: 1,
        endCondition: 'count',
        endCount: 2,
      },
    });

    await screen.findByText('일정이 추가되었습니다.');

    const monthView = within(screen.getByTestId('month-view'));
    await waitFor(() =>
      expect(monthView.getByText(formatMonth(new Date('2025-10-01')))).toBeInTheDocument()
    );

    const eventElements = monthView.getAllByText('횟수 제한 반복 이벤트');
    expect(eventElements.length).toBe(2);
    expect(
      eventElements.some((el) => el.closest('td')?.getAttribute('data-date') === '2025-10-01')
    ).toBe(true);
    expect(
      eventElements.some((el) => el.closest('td')?.getAttribute('data-date') === '2025-10-02')
    ).toBe(true);

    const dayCellFor3rd = monthView.getByText('3').closest('td');
    if (dayCellFor3rd) {
      expect(within(dayCellFor3rd).queryByText('횟수 제한 반복 이벤트')).not.toBeInTheDocument();
    } else {
      throw new Error('3일 날짜 셀을 찾을 수 없습니다.');
    }
  });
});
