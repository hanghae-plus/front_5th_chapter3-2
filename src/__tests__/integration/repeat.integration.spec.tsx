import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import {
  setupMockHandlerRepeatCreation,
  setupMockHandlerRepeatDeletion,
  setupMockHandlerRepeatUpdating,
} from '../../__mocks__/handlersUtils';
import App from '../../App';
import { Event } from '../../types';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

const saveRepeatSchedule = async (
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
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeat?.type);
  await user.clear(screen.getByLabelText('반복 간격'));
  await user.type(screen.getByLabelText('반복 간격'), repeat?.interval.toString());
  await user.type(screen.getByLabelText('반복 종료일'), repeat?.endDate!.toString());

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정', () => {
  it('2월 29일에 매년 반복일정을 설정하면, 윤년이 아닌 해에는 2월 28일에 생성되는지 확인한다.', async () => {
    vi.setSystemTime(new Date('2025-02-28 08:49:59'));

    setupMockHandlerRepeatCreation();

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '윤년 반복 일정',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '윤년 반복 일정 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2025-09-30' },
    });

    const eventList = within(screen.getByTestId('event-list'));

    expect(eventList.getByText('2025-02-28')).toBeInTheDocument();
    expect(eventList.getByText('윤년 반복 일정')).toBeInTheDocument();
  });

  it('31일에 매월 반복일정을 설정하면, 31일이 없는 달에는 30일 또는 말일에 생성되는지 확인한다.', async () => {
    vi.setSystemTime(new Date('2025-04-30 08:49:59'));

    setupMockHandlerRepeatCreation();

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '매월 반복 일정',
      date: '2025-03-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '매월 반복 일정 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-09-30' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-04-30')).toBeInTheDocument();
    expect(eventList.getByText('매월 반복 일정')).toBeInTheDocument();
  });

  it('설정한 반복 간격에 따라 일정이 올바른 날짜에 생성되는지 확인한다.', async () => {
    vi.setSystemTime(new Date('2025-07-01 08:49:59'));

    setupMockHandlerRepeatCreation();

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '반복 간격 일정',
      date: '2025-05-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '매월 반복 일정',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 2, endDate: '2025-09-30' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-07-01')).toBeInTheDocument();
    expect(eventList.getByText('반복 간격 일정')).toBeInTheDocument();
  });

  it("반복 종료 조건이 '2025-09-30까지'로 설정된 경우, 해당 날짜 이후에는 반복 일정이 생성되지 않는다.", async () => {
    vi.setSystemTime(new Date('2025-10-01 08:49:59'));

    setupMockHandlerRepeatCreation();

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '반복 종료 일정',
      date: '2025-05-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '반복 종료 일정',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-09-30' },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.queryByText('2025-10-01')).toBeNull();
    expect(eventList.queryByText('반복 종료 일정')).toBeNull();
  });

  it('캘린더 뷰에서 반복 일정에 반복 아이콘 또는 태그가 표시된다.', async () => {
    vi.setSystemTime(new Date('2025-05-01 08:49:59'));

    setupMockHandlerRepeatCreation();

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await saveRepeatSchedule(user, {
      title: '매월 반복 일정',
      date: '2025-05-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '매월 반복 일정',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-09-30' },
    });

    const monthView = within(screen.getByTestId('month-view'));

    const titleElement = monthView.getByText('매월 반복 일정');
    expect(titleElement).toBeInTheDocument();

    const container = titleElement.closest('div');
    expect(within(container!).getByLabelText('반복 일정 아이콘')).toBeInTheDocument();
  });

  it('반복 일정의 한 인스턴스를 수정하면, 해당 일정이 반복에서 분리되어 단일 일정으로 변경된다.', async () => {
    vi.setSystemTime(new Date('2025-05-01 08:49:59'));

    setupMockHandlerRepeatUpdating();

    const { user } = setup(<App />);

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 반복 일정');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '수정된 반복 일정 내용');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));

    expect(eventList.getByText('수정된 반복 일정')).toBeInTheDocument();
    expect(eventList.getByText('수정된 반복 일정 내용')).toBeInTheDocument();
  });

  it('반복 일정의 한 인스턴스를 삭제하면, 해당 일정만 삭제되고 나머지 반복 일정에는 영향이 없다.', async () => {
    vi.setSystemTime(new Date('2025-05-01 08:49:59'));

    setupMockHandlerRepeatDeletion();

    const { user } = setup(<App />);

    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('매월 반복 일정')).toBeInTheDocument();

    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    await screen.findByText('일정이 삭제되었습니다.');

    const nextButton = screen.getByLabelText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('2025-06-01')).toBeInTheDocument();
    });
  });
});
