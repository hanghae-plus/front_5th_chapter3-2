import { render, screen, within, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import { server } from '../setupTests';
import App from '../App';
import { AppProviders } from '../AppProviders';
import { Event } from '../types';

// Test setup utility
const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return { ...render(<AppProviders>{element}</AppProviders>), user };
};

// Utility to create a recurring event
const createRecurringEvent = async (
  user: UserEvent,
  {
    title,
    date,
    startTime,
    endTime,
    description,
    location,
    category,
    repeatType,
    repeatInterval,
    repeatEndDate,
  }: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    location: string;
    category: string;
    repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatInterval: number;
    repeatEndDate: string;
  }
) => {
  // Open the event form
  await user.click(screen.getAllByText('일정 추가')[0]);

  // Fill in basic event details
  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  // Set recurring options
  await user.click(screen.getByLabelText('반복 일정'));
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeatType);
  
  // Clear the default interval and set new one
  await user.clear(screen.getByLabelText('반복 간격'));
  await user.type(screen.getByLabelText('반복 간격'), repeatInterval.toString());
  
  // Set end date
  await user.type(screen.getByLabelText('반복 종료일'), repeatEndDate);

  // Submit the form
  await user.click(screen.getByTestId('event-submit-button'));
};

// Mock recurring events
const mockRecurringEvents = {
  events: [
    {
      id: '1',
      title: '매주 회의',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '팀 주간 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        id: 'repeat-1',
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-31'
      },
      notificationTime: 10
    },
    {
      id: '2',
      title: '매주 회의',
      date: '2025-10-08',
      startTime: '10:00',
      endTime: '11:00',
      description: '팀 주간 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        id: 'repeat-1',
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-31'
      },
      notificationTime: 10
    },
    {
      id: '3',
      title: '매주 회의',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '팀 주간 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        id: 'repeat-1',
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-31'
      },
      notificationTime: 10
    }
  ]
};

describe('반복 일정 기능', () => {
  // Failing test for selecting recurrence type
  it('반복 유형을 선택할 수 없다 (실패 테스트)', async () => {
    const { user } = setup(<App />);
    await user.click(screen.getAllByText('일정 추가')[0]);
    
    // Try to find the checkbox for recurrence but it shouldn't be available
    expect(() => screen.getByLabelText('반복 일정')).toThrow();
  });

  // Failing test for setting recurrence interval
  it('반복 간격을 설정할 수 없다 (실패 테스트)', async () => {
    const { user } = setup(<App />);
    await user.click(screen.getAllByText('일정 추가')[0]);
    
    // Try to check the recurrence checkbox (assuming it exists now)
    await user.click(screen.getByLabelText('반복 일정'));
    
    // Try to find the interval input but it shouldn't be available
    expect(() => screen.getByLabelText('반복 간격')).toThrow();
  });

  // Failing test for visual distinction of recurring events
  it('캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시할 수 없다 (실패 테스트)', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockRecurringEvents);
      })
    );
    
    setup(<App />);
    
    // Try to find a visual indicator for recurring events but it shouldn't exist
    await waitFor(() => screen.findByText('매주 회의'));
    expect(screen.queryByTestId('recurring-event-icon')).not.toBeInTheDocument();
  });

  // Failing test for setting recurrence end date
  it('반복 종료 조건을 지정할 수 없다 (실패 테스트)', async () => {
    const { user } = setup(<App />);
    await user.click(screen.getAllByText('일정 추가')[0]);
    
    // Try to check the recurrence checkbox
    await user.click(screen.getByLabelText('반복 일정'));
    
    // Try to find the end date input but it shouldn't be available
    expect(() => screen.getByLabelText('반복 종료일')).toThrow();
  });

  // Failing test for modifying a single instance of a recurring event
  it('반복 일정의 단일 수정이 불가능하다 (실패 테스트)', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockRecurringEvents);
      })
    );
    
    const { user } = setup(<App />);
    
    // Wait for events to load
    await waitFor(() => screen.findByText('매주 회의'));
    
    // Try to edit the event
    await user.click(screen.getAllByLabelText('Edit event')[0]);
    
    // Change the title
    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    
    // Submit the form
    await user.click(screen.getByTestId('event-submit-button'));
    
    // The edited event should still show the recurring icon (but it shouldn't)
    const eventItem = screen.getAllByText('수정된 회의')[0].closest('li');
    expect(within(eventItem).queryByTestId('recurring-event-icon')).toBeInTheDocument();
  });

  // Failing test for deleting a single instance of a recurring event
  it('반복 일정의 단일 삭제가 불가능하다 (실패 테스트)', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockRecurringEvents);
      })
    );
    
    const { user } = setup(<App />);
    
    // Wait for events to load
    await waitFor(() => screen.findByText('매주 회의'));
    
    // Count initial events
    const initialEvents = screen.getAllByText('매주 회의');
    const initialCount = initialEvents.length;
    
    // Delete one event
    await user.click(screen.getAllByLabelText('Delete event')[0]);
    
    // All events with the same repeat.id should be deleted, not just one
    // So this should fail because we only want to delete a single instance
    const remainingEvents = screen.getAllByText('매주 회의');
    expect(remainingEvents.length).toBe(initialCount - 1);
  });

  // Success test for selecting recurrence type
  it('반복 유형을 선택할 수 있다', async () => {
    const { user } = setup(<App />);
    
    // Mock the API call for creating events
    server.use(
      http.post('/api/events-list', () => {
        return HttpResponse.json([
          {
            id: '1',
            title: '매주 회의',
            date: '2025-10-01',
            startTime: '14:00',
            endTime: '15:00',
            description: '반복 회의',
            location: '회의실 A',
            category: '업무',
            repeat: {
              id: 'repeat-1',
              type: 'weekly',
              interval: 2,
              endDate: '2025-10-31'
            },
            notificationTime: 10
          }
        ]);
      })
    );
    
    await createRecurringEvent(user, {
      title: '매주 회의',
      date: '2025-10-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '반복 회의',
      location: '회의실 A',
      category: '업무',
      repeatType: 'weekly',
      repeatInterval: 2,
      repeatEndDate: '2025-10-31'
    });
    
    // Verify the event was created with correct recurrence settings
    await waitFor(() => screen.findByText('매주 회의'));
    expect(screen.getByText('매주 회의')).toBeInTheDocument();
  });

  // Success test for visual distinction of recurring events
  it('캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockRecurringEvents);
      })
    );
    
    setup(<App />);
    
    // Wait for the events to load
    await waitFor(() => screen.findByText('매주 회의'));
    
    // Find the recurring event icon
    const eventItem = screen.getAllByText('매주 회의')[0].closest('li');
    expect(within(eventItem).getByTestId('recurring-event-icon')).toBeInTheDocument();
  });

  // Success test for modifying a single instance of a recurring event
  it('반복 일정의 단일 수정이 가능하다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockRecurringEvents);
      }),
      http.put('/api/events/:id', () => {
        return HttpResponse.json({
          id: '1',
          title: '수정된 회의',
          date: '2025-10-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '팀 주간 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10
        });
      })
    );
    
    const { user } = setup(<App />);
    
    // Wait for events to load
    await waitFor(() => screen.findByText('매주 회의'));
    
    // Edit the first event
    await user.click(screen.getAllByLabelText('Edit event')[0]);
    
    // Change the title
    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    
    // Submit the form
    await user.click(screen.getByTestId('event-submit-button'));
    
    // Verify the event was edited and is no longer recurring
    await waitFor(() => screen.findByText('수정된 회의'));
    const eventItem = screen.getByText('수정된 회의').closest('li');
    expect(within(eventItem).queryByTestId('recurring-event-icon')).not.toBeInTheDocument();
  });

  // Success test for deleting a single instance of a recurring event
  it('반복 일정의 단일 삭제가 가능하다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockRecurringEvents);
      }),
      http.delete('/api/events/:id', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );
    
    const { user } = setup(<App />);
    
    // Wait for events to load
    await waitFor(() => screen.findByText('매주 회의'));
    
    // Count initial events
    const initialEvents = screen.getAllByText('매주 회의');
    const initialCount = initialEvents.length;
    
    // Delete one event
    await user.click(screen.getAllByLabelText('Delete event')[0]);
    
    // Only one instance should be deleted
    await waitFor(() => {
      const remainingEvents = screen.getAllByText('매주 회의');
      expect(remainingEvents.length).toBe(initialCount - 1);
    });

    // Other instances of the recurring event should still exist
    expect(screen.getAllByText('매주 회의').length).toBe(2);
  });
}); 