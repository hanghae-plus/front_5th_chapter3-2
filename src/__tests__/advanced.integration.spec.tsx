import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event, RepeatType } from '../types';

export interface RepeatInfo {
  type: RepeatType; // 반복 유형
  interval: number; // 반복 간격
  endDate?: string; // 종료 날짜
}

const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

// 반복 일정 저장을 위한 헬퍼 함수
const saveRepeatSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id'> & { repeat: RepeatInfo }
) => {
  const {
    title,
    date,
    startTime,
    endTime,
    location,
    description,
    category,
    repeat,
    notificationTime,
  } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  // 기본 일정 정보 입력
  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정 이벤트', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-05-23'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('반복 일정을 추가하면, 해당 일정의 모든 반복 일정이 추가되어야 한다', async () => {
    setupMockHandlerCreation();
    const { user } = setup(<App />);

    await saveRepeatSchedule(user, {
      title: '반복 회의',
      date: '2025-05-23',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-06-06',
      },
      notificationTime: 10,
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getAllByText('반복 회의')).toHaveLength(15);
  });

  it('주간 반복 일정을 추가하면 지정된 주 수만큼 반복된다', async () => {
    setupMockHandlerCreation();
    const { user } = setup(<App />);

    await saveRepeatSchedule(user, {
      title: '주간 팀 미팅',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 회의',
      location: '회의실 B',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-11-12',
      },
      notificationTime: 15,
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getAllByText('주간 팀 미팅')).toHaveLength(4);
  });

  it('반복 일정 중 하나를 삭제하면 해당 일정만 삭제된다', async () => {
    setupMockHandlerCreation();
    setupMockHandlerDeletion();
    const { user } = setup(<App />);

    // 반복 일정 생성
    await saveRepeatSchedule(user, {
      title: '삭제할 반복 회의',
      date: '2025-05-23',
      startTime: '16:00',
      endTime: '17:00',
      description: '삭제 테스트',
      location: '회의실 C',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-27',
      },
      notificationTime: 10,
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getAllByText('삭제할 반복 회의')).toHaveLength(5);

    // 첫 번째 반복 일정 삭제
    const deleteButtons = await screen.findAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    // 하나만 삭제되고 나머지는 유지
    expect(eventList.getAllByText('삭제할 반복 회의')).toHaveLength(4);
  });
});
