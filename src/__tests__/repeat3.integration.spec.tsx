import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';

import App from '../App';
import { server } from '../setupTests';

const setup = () => {
  const user = userEvent.setup();
  return {
    user,
    ...render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    ),
  };
};

describe('반복 일정 표시 기능 테스트', () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date('2024-05-20'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('캘린더 뷰에서 반복 일정이 시각적으로 구분되어 표시된다', async () => {
    // 반복 일정과 일반 일정이 포함된 이벤트 데이터 설정
    const { user } = setup();

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: '1',
              title: '일반 일정',
              date: '2024-05-20',
              startTime: '09:00',
              endTime: '10:00',
              description: '반복되지 않는 일정',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: '2',
              title: '반복 일정',
              date: '2024-05-21',
              startTime: '14:00',
              endTime: '15:00',
              description: '매주 반복되는 일정',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'weekly', interval: 1, endDate: '2024-06-30' },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    await screen.findByText('일정 로딩 완료!');

    // 월별 뷰 선택
    await user.selectOptions(screen.getByLabelText('view'), 'month');

    const monthView = within(screen.getByTestId('month-view'));
    const repeatIcons = monthView.queryAllByTestId('repeat-icon');
    expect(repeatIcons.length).toBeGreaterThan(0);

    const repeatEventElements = monthView.getAllByText('반복 일정');
    expect(repeatEventElements[0].closest('.repeating-event')).toBeInTheDocument();
  });
});
