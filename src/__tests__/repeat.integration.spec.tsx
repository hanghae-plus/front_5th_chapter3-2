import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import {
  setupMockHandlerDeletion,
  setupMockHandlerListCreation,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { Event } from '../types';

const renderApp = () => {
  render(
    <ChakraProvider>
      <App />
    </ChakraProvider>
  );
};

const events: Event[] = [
  {
    id: '1',
    title: '기존 회의',
    date: '2025-05-10',
    startTime: '09:00',
    endTime: '10:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0, endType: 'none' },
    notificationTime: 10,
    isRecurring: undefined,
  },
];

describe('repeat.integration.spec.ts', () => {
  const newEvent: Event = {
    id: '2',
    title: '매일 반복 이벤트',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: {
      type: 'daily',
      interval: 1,
      endType: 'date',
      endDate: '2025-05-22',
      endCount: undefined,
    },
    notificationTime: 10,
    isRecurring: true,
  };

  it('이벤트 생성 시 반복 정보가 적용된다.', async () => {
    const repeatedEvents = [
      {
        ...newEvent,
        date: '2025-05-20',
      },
      {
        ...newEvent,
        id: '3',
        date: '2025-05-21',
        isRecurring: true,
      },
      {
        ...newEvent,
        id: '4',
        date: '2025-05-22',
        isRecurring: true,
      },
    ];
    setupMockHandlerListCreation([...events, ...repeatedEvents]);
    renderApp();
    const user = userEvent.setup();
    const titleInput = screen.getByLabelText('제목');
    const dateInput = screen.getByLabelText('날짜');
    const startTimeInput = screen.getByLabelText('시작 시간');
    const endTimeInput = screen.getByLabelText('종료 시간');
    const descriptionInput = screen.getByLabelText('설명');
    const locationInput = screen.getByLabelText('위치');
    const categorySelect = screen.getByLabelText('카테고리');
    const notificationTimeSelect = screen.getByLabelText('알림 설정');
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);
    const repeatTypeSelect = await screen.findByTestId('repeat-type-select');
    const repeatEndTypeSelect = await screen.findByTestId('repeat-end-type-select');
    const repeatIntervalInput = await screen.findByLabelText('반복 간격');
    const repeatEndDateInput = await screen.findByLabelText('반복 종료일');
    await user.type(titleInput, newEvent.title);
    await user.clear(dateInput);
    await user.type(dateInput, newEvent.date);
    await user.clear(startTimeInput);
    await user.type(startTimeInput, newEvent.startTime);
    await user.clear(endTimeInput);
    await user.type(endTimeInput, newEvent.endTime);
    await user.type(descriptionInput, newEvent.description);
    await user.type(locationInput, newEvent.location);
    await user.selectOptions(categorySelect, newEvent.category);
    await user.selectOptions(notificationTimeSelect, newEvent.notificationTime.toString());
    await user.selectOptions(repeatTypeSelect, newEvent.repeat.type);
    await user.selectOptions(repeatEndTypeSelect, newEvent.repeat.endType);
    await user.clear(repeatIntervalInput);
    await user.type(repeatIntervalInput, newEvent.repeat.interval.toString());
    await user.clear(repeatEndDateInput);
    await user.type(repeatEndDateInput, newEvent.repeat.endDate!);
    const addButton = screen.getByRole('button', { name: '일정 추가' });
    await user.click(addButton);
    await waitFor(
      () => {
        const eventList = screen.getByTestId('event-list');
        const eventElements = within(eventList).getAllByText(newEvent.title);
        expect(eventElements).toHaveLength(3);
      },
      { timeout: 5000 }
    );
  });

  it('이벤트 수정 시 반복 정보가 적용된다', async () => {
    const updatedEvents = [
      {
        ...events[0],
        title: '수정된 이벤트',
        repeat: {
          type: 'daily',
          interval: 1,
          endType: 'date',
          endDate: '2025-05-21',
        },
        isRecurring: true,
      },
    ];
    setupMockHandlerListCreation(events);
    setupMockHandlerUpdating(updatedEvents);
    renderApp();

    const user = userEvent.setup();

    // 이벤트 리스트가 렌더링될 때까지 기다립니다
    await waitFor(() => {
      const eventList = screen.getByTestId('event-list');
      expect(eventList).toBeInTheDocument();
    });

    // Edit 버튼이 나타날 때까지 기다립니다
    const editButton = await screen.findByLabelText('Edit event', {}, { timeout: 2000 });
    await user.click(editButton);

    // 나머지 테스트 코드...
    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 이벤트');

    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    const repeatTypeSelect = await screen.findByTestId('repeat-type-select');
    const repeatEndTypeSelect = await screen.findByTestId('repeat-end-type-select');
    const repeatIntervalInput = await screen.findByLabelText('반복 간격');
    const repeatEndDateInput = await screen.findByLabelText('반복 종료일');

    await user.selectOptions(repeatTypeSelect, 'daily');
    await user.selectOptions(repeatEndTypeSelect, 'date');
    await user.clear(repeatIntervalInput);
    await user.type(repeatIntervalInput, '1');
    await user.clear(repeatEndDateInput);
    await user.type(repeatEndDateInput, '2025-05-21');

    // 수정 버튼을 텍스트로 찾기
    const submitButton = screen.getByRole('button', { name: '일정 수정' });
    await user.click(submitButton);

    await waitFor(
      () => {
        const list = screen.getByTestId('event-list');
        expect(within(list).getByText('수정된 이벤트')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('이벤트 삭제 시 반복 정보가 적용된다', async () => {
    setupMockHandlerDeletion([]);
    renderApp();
    const user = userEvent.setup();

    const deleteButton = await screen.findByLabelText('Delete event');
    await user.click(deleteButton);

    await waitFor(() => {
      const list = screen.getByTestId('event-list');
      expect(within(list).queryByText(events[0].title)).not.toBeInTheDocument();
    });
  });
});
