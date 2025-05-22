import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupMockHandlerEventsListCreation } from '../__mocks__/handlersUtils';
import App from '../App';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

describe('반복 일정과 뷰 통합 테스트', () => {
  it('반복 일정을 생성하고 주별 view에서 확인한다', async () => {
    setupMockHandlerEventsListCreation([
      {
        id: '1',
        title: '주간 회의',
        date: '2025-10-01',
        startTime: '14:00',
        endTime: '15:00',
        description: '매주 수요일 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '주간 회의',
        date: '2025-10-08',
        startTime: '14:00',
        endTime: '15:00',
        description: '매주 수요일 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '주간 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '매주 수요일 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '주간 회의',
        date: '2025-10-22',
        startTime: '14:00',
        endTime: '15:00',
        description: '매주 수요일 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '주간 회의',
        date: '2025-10-29',
        startTime: '14:00',
        endTime: '15:00',
        description: '매주 수요일 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('주간 회의')).toBeInTheDocument();
  });
});
