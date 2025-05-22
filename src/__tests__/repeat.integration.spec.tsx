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

// 통합에서 테스트할것

// 1. 반복 유형 select, option(매일 매주 매월 매년) 체크
// 2. 반복 일정 CRUD, 캘린더 표시

// ! Hard 여기 제공 안함
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
  await user.click(screen.getByLabelText('반복 일정'));

  if (repeat.type !== 'none') {
    await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), repeat.interval.toString());
    await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate || '');
  }
  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 유형 선택', () => {
  it('일정 생성 시 반복 일정 checkBox가 존재한다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await act(() => Promise.resolve(null));

    const repeatSchedule = screen.getByLabelText('반복 일정');
    expect(repeatSchedule).toBeInTheDocument();
  });

  it('반복 일정 체크 시 반복 유형 select가 존재한다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await act(() => Promise.resolve(null));

    const repeatSchedule = screen.getByLabelText('반복 일정');
    await user.click(repeatSchedule);

    const repeatType = screen.getByLabelText('반복 유형');
    expect(repeatType).toBeInTheDocument();
  });

  it('반복 일정 체크 시 반복 유형 select에는 매일, 매주, 매월, 매년 Option이 존재한다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await act(() => Promise.resolve(null));

    const repeatSchedule = screen.getByLabelText('반복 일정');
    await user.click(repeatSchedule);

    const repeatInterval = screen.getByLabelText('반복 유형');
    expect(repeatInterval).toBeInTheDocument();

    const repeatOptions = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
    repeatOptions.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });
});

describe('반복 일정 CRUD', () => {
  // 일정 생성과 반복아이콘 생성 테스트
  it('일정 생성 시 반복 일정이 정상적으로 생성된다.', async () => {
    setupMockHandlerCreation();
    const { user } = setup(<App />);

    await act(() => Promise.resolve(null));

    await saveSchedule(user, {
      title: '반복 일정 테스트',
      date: '2025-05-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '설명',
      location: '회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
    });

    await screen.findByText('일정이 추가되었습니다.');

    const repeatIcons = await screen.findAllByLabelText('R');
    expect(repeatIcons).toHaveLength(3);
  });

  // 일정 수정 테스트
  it('일정 수정 시 반복 일정이 정상적으로 수정된다.', async () => {
    const { user } = setup(<App />);
    await act(() => Promise.resolve(null));

    setupMockHandlerUpdating([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-05-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
        notificationTime: 10,
      },
    ]);

    await user.click(await screen.findByLabelText('Edit event'));
    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '기존 회의 UPDATE');
    await user.click(screen.getByLabelText('반복 일정'));

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));

    expect(eventList.queryByTestId('repeat-info')).not.toBeInTheDocument();
  });

  it('반복 일정 중 하나를 삭제하면 해당 일정만 사라지고 나머지는 유지된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerDeletion([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-05-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-05-17' },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '기존 회의',
        date: '2025-05-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-05-17' },
        notificationTime: 5,
      },
      {
        id: '3',
        title: '기존 회의',
        date: '2025-05-17',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-05-17' },
        notificationTime: 5,
      },
    ]);

    const deleteButtons = await screen.findAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    await screen.findByText('일정이 삭제되었습니다.');

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.queryByTestId('repeat-info')).not.toBeInTheDocument();
    });
  });
});
