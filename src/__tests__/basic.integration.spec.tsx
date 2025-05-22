import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import {
  setupMockHandlerDeletion,
  setupMockHandlerEventsListCreation,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { Event } from '../types';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

const saveRepeatedSchedule = async (
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

  await user.click(screen.getByLabelText('반복 일정'));

  if (repeat.type !== 'none') {
    await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), repeat.interval.toString());
    await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate || '');
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정 CRUD 테스트', () => {
  describe('반복 일정 생성', () => {
    it('반복 일정이 생성되면 여러 날짜에 일정이 표시되고 반복 아이콘이 함께 노출된다', async () => {
      setupMockHandlerEventsListCreation();

      const { user } = setup(<App />);

      await screen.findByText('일정 로딩 완료!');

      await saveRepeatedSchedule(user, {
        title: '반복 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '설명',
        location: '회의실',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-03' },
      });

      await screen.findByText('일정이 추가되었습니다.');

      const repeatIcons = await screen.findAllByLabelText('repeat-icon');
      expect(repeatIcons).toHaveLength(3);
    });
  });

  describe('반복 일정 수정', () => {
    it('반복 일정을 수정하면 단일 일정으로 변경되며 반복 일정 아이콘도 사라진다.', async () => {
      const { user } = setup(<App />);

      setupMockHandlerUpdating([
        {
          id: '1',
          title: '새 회의',
          date: '2025-10-01',
          startTime: '11:00',
          endTime: '12:00',
          description: '새로운 팀 미팅',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'monthly', interval: 1, endDate: '2025-10-02' },
          notificationTime: 5,
        },
      ]);

      await user.click(await screen.findByLabelText('Edit event'));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 회의');
      await user.clear(screen.getByLabelText('설명'));
      await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

      await user.click(screen.getByTestId('event-submit-button'));

      const eventList = within(screen.getByTestId('event-list'));

      expect(eventList.queryByTestId('repeat-info')).not.toBeInTheDocument();

      const monthView = within(screen.getByTestId('month-view'));
      const repeatIcon = monthView.queryByLabelText('repeat-icon');

      expect(repeatIcon).not.toBeInTheDocument();
    });
  });

  describe('반복 일정 단일 삭제', () => {
    it('반복 일정 중 하나를 삭제하면 해당 일정만 사라지고 나머지는 유지된다', async () => {
      const { user } = setup(<App />);

      setupMockHandlerDeletion([
        {
          id: '1',
          title: '새 회의',
          date: '2025-10-01',
          startTime: '11:00',
          endTime: '12:00',
          description: '새로운 팀 미팅',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-03' },
          notificationTime: 5,
        },
        {
          id: '2',
          title: '새 회의',
          date: '2025-10-02',
          startTime: '11:00',
          endTime: '12:00',
          description: '새로운 팀 미팅',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-03' },
          notificationTime: 5,
        },
        {
          id: '3',
          title: '새 회의',
          date: '2025-10-03',
          startTime: '11:00',
          endTime: '12:00',
          description: '새로운 팀 미팅',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-03' },
          notificationTime: 5,
        },
      ]);

      await screen.findByText('일정 로딩 완료!');

      const deleteButtons = await screen.findAllByLabelText('Delete event');
      await user.click(deleteButtons[0]);

      await screen.findByText('일정이 삭제되었습니다.');

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.queryByTestId('repeat-info')).not.toBeInTheDocument();
      });
    });
  });
});
