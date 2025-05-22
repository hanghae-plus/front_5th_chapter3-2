import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { AppProviders } from '../../AppProviders';
import { EventList } from '../../components/EventList';
import { Event } from '../../types';

// Mock context hooks
vi.mock('../../contexts/EventFormContext', () => ({
  useEventFormContext: () => ({
    editEvent: vi.fn(),
  }),
}));

vi.mock('../../hooks', () => ({
  useEventOperations: () => ({
    deleteEvent: vi.fn(),
  }),
}));

// Mock regular event
const regularEvent: Event = {
  id: 'event-1',
  title: '일반 회의',
  date: '2025-10-15',
  startTime: '10:00',
  endTime: '11:00',
  description: '일반 회의입니다',
  location: '회의실 A',
  category: '업무',
  repeat: {
    type: 'none',
    interval: 0,
  },
  notificationTime: 10,
};

// Mock recurring event
const recurringEvent: Event = {
  id: 'event-2',
  title: '반복 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복 회의입니다',
  location: '회의실 B',
  category: '업무',
  repeat: {
    type: 'weekly',
    interval: 1,
    endDate: '2025-11-15',
  },
  notificationTime: 10,
};

describe('EventList 컴포넌트 테스트', () => {
  // 실패 테스트: 반복 일정 시각적 구분 요소 없음
  it('반복 일정에 대한 시각적 구분 요소가 없다 (실패 테스트)', () => {
    render(
      <AppProviders>
        <EventList
          filteredEvents={[regularEvent, recurringEvent]}
          notifiedEvents={[]}
          searchTerm=""
          onSearchTermChange={vi.fn()}
        />
      </AppProviders>
    );

    // 화면에 일반 회의와 반복 회의가 표시되는지 확인
    expect(screen.getByText('일반 회의')).toBeInTheDocument();
    expect(screen.getByText('반복 회의')).toBeInTheDocument();

    // 반복 일정 아이콘이 없는지 확인 (현재 구현은 아이콘이 아닌 텍스트로 표시)
    expect(screen.queryByTestId('recurring-event-icon')).not.toBeInTheDocument();
  });

  // 성공 테스트: 반복 일정 시각적 구분
  it('반복 일정은 시각적으로 구분되어 표시된다', () => {
    render(
      <AppProviders>
        <EventList
          filteredEvents={[regularEvent, recurringEvent]}
          notifiedEvents={[]}
          searchTerm=""
          onSearchTermChange={vi.fn()}
        />
      </AppProviders>
    );

    // 화면에 일반 회의와 반복 회의가 표시되는지 확인
    expect(screen.getByText('일반 회의')).toBeInTheDocument();
    expect(screen.getByText('반복 회의')).toBeInTheDocument();

    // 반복 텍스트가 표시되는지 확인
    expect(screen.getByText('반복: 1주마다 (종료: 2025-11-15)')).toBeInTheDocument();

    // 일반 일정에는 반복 표시가 없음
    const regularEventBox = screen.getByTestId('event-event-1');
    expect(regularEventBox).not.toHaveTextContent('반복:');

    // 반복 일정에는 반복 표시가 있음
    const recurringEventBox = screen.getByTestId('event-event-2');
    expect(recurringEventBox).toHaveTextContent('반복: 1주마다');
  });
});
