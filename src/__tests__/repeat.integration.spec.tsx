import { randomUUID } from 'crypto';

import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import { setupMockHandlerRecurring } from '../__mocks__/handlersUtils.ts';
import App from '../App';
import { RepeatSchedule } from '../components/RepeatSchedule';
import { server } from '../setupTests';
import { Event } from '../types';
import { generateDailyDates } from '../utils/repeatUtils.ts';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return {
    user,
    ...render(<ChakraProvider>{element}</ChakraProvider>),
  };
};

// const saveSchedule = async (
//   user: UserEvent,
//   form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
// ) => {
//   const { title, date, startTime, endTime, location, description, category } = form;

//   await user.click(screen.getAllByText('일정 추가')[0]);

//   await user.type(screen.getByLabelText('제목'), title);
//   await user.type(screen.getByLabelText('날짜'), date);
//   await user.type(screen.getByLabelText('시작 시간'), startTime);
//   await user.type(screen.getByLabelText('종료 시간'), endTime);
//   await user.type(screen.getByLabelText('설명'), description ?? '');
//   await user.type(screen.getByLabelText('위치'), location ?? '');
//   await user.selectOptions(screen.getByLabelText('카테고리'), category ?? '');

//   await user.click(screen.getByTestId('event-submit-button'));
// };

describe('integration test', () => {
  type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  const mockEvent = (repeatType?: RepeatType, options = {}) => ({
    id: '1',
    title: '테스트 일정',
    date: '2024-03-20',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '',
    repeat: {
      type: repeatType || 'none',
      interval: 1,
      endDate: '2024-04-20',
    },
    notificationTime: 10,
    ...options,
  });

  describe('반복 일정 표시', () => {
    it('반복 일정인 경우 반복 아이콘이 표시되어야 한다.', () => {
      const event = mockEvent('daily');

      setup(<RepeatSchedule event={event} />);

      const repeatIcon = screen.queryByTestId('repeat-icon');
      expect(repeatIcon).toBeInTheDocument();
    });
  });

  describe('반복 종료 조건', () => {
    // src/__tests__/recurringSchedule.test.tsx
    it(
      '특정 날짜까지 반복되어야 한다.',
      async () => {
        const { mockEvents } = setupMockHandlerRecurring();
        const { user } = setup(<App />);

        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7 * 6);

        // 기본 일정 입력
        await user.type(screen.getByLabelText('제목'), '격주 회의');
        await user.type(screen.getByLabelText('날짜'), formatDate(today));
        await user.type(screen.getByLabelText('시작 시간'), '10:00');
        await user.type(screen.getByLabelText('종료 시간'), '11:00');
        await user.type(screen.getByLabelText('설명'), '2주마다 진행되는 회의');
        await user.type(screen.getByLabelText('위치'), '회의실 A');
        await user.selectOptions(screen.getByLabelText('카테고리'), '업무');

        // // 반복 일정 체크
        // const repeatCheckbox = screen.getByRole("checkbox", { name: "반복 일정" }) as HTMLInputElement;
        //
        //
        // if (!repeatCheckbox.checked) {
        //   await user.click(repeatCheckbox);
        // };

        // — 여기부터 기다려 줍니다 —
        // 반복 유형 Select가 나타날 때까지 대기
        const label = await screen.findByText('반복 유형');
        const formControl = label.closest('[role="group"]') as HTMLDivElement;
        const repeatTypeSelect = within(formControl).getByRole('combobox');
        await user.selectOptions(repeatTypeSelect, 'weekly');

        // 반복 간격 입력 필드도 이미 렌더링된 상태이므로 getByLabelText로 OK
        const intervalInput = screen.getByLabelText('반복 간격');
        await user.clear(intervalInput);
        await user.type(intervalInput, '2');

        // 반복 종료일 입력 필드
        const endDateInput = screen.getByLabelText('반복 종료일');
        await user.type(endDateInput, formatDate(endDate));

        // 저장 버튼 클릭
        await user.click(screen.getByTestId('event-submit-button'));

        // mockEvents 반영 대기
        await waitFor(() => {
          expect(mockEvents.length).toBeGreaterThan(0);
        });

        // 화면 아이콘 확인
        await waitFor(() => {
          expect(screen.getAllByTestId('repeat-icon').length).toBeGreaterThan(0);
        });
      },
      { timeout: 15_000 }
    );

    it('특정 횟수만큼 반복되어야 한다', async () => {
      // 1) MSW 반복 핸들러 준비
      const { mockEvents } = setupMockHandlerRecurring();

      // 2) 렌더링 & userEvent 준비
      const { user } = setup(<App />);

      // 3) 오늘 날짜 & 6주 후(endDate) 계산
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7 * 6); // 6주 후

      // 4) 폼 채우기
      await user.type(screen.getByLabelText('제목'), '격주 회의');
      await user.type(screen.getByLabelText('날짜'), formatDate(today));
      await user.type(screen.getByLabelText('시작 시간'), '10:00');
      await user.type(screen.getByLabelText('종료 시간'), '11:00');
      await user.type(screen.getByLabelText('설명'), '2주마다 진행되는 회의');
      await user.type(screen.getByLabelText('위치'), '회의실 A');
      await user.selectOptions(screen.getByLabelText('카테고리'), '업무');

      const repeatTypeSelect = await screen.findByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelect, 'weekly');
      const intervalInput = screen.getByLabelText('반복 간격');
      await user.clear(intervalInput);
      await user.type(intervalInput, '2');
      const endDateInput = screen.getByLabelText('반복 종료일');
      await user.type(endDateInput, formatDate(endDate));

      // 6) 저장
      await user.click(screen.getByTestId('event-submit-button'));

      // 7) mockEvents에 4건이 쌓일 때까지 대기 (0주,2주,4주,6주)
      await waitFor(() => {
        expect(mockEvents.length).toBe(4);
      });

      // 8) 날짜도 정확히 생성되었는지 확인
      const expectedOffsets = [0, 14, 28, 42]; // days
      const expectedDates = expectedOffsets.map((days) =>
        formatDate(new Date(today.getTime() + days * 24 * 60 * 60 * 1000))
      );
      const actualDates = mockEvents.map((e) => e.date).sort();
      expect(actualDates).toEqual(expectedDates);
    }, 15000);
    it('종료 조건이 없는 경우 2025-09-30까지 반복되어야 한다', () => {
      // 2025-09-22부터 테스트 시작
      const start = '2025-09-22';
      const dailyEvent = {
        id: '1',
        title: '끝없는 데일리',
        date: start,
        startTime: '09:00',
        endTime: '09:30',
        repeat: {
          type: 'daily' as const,
          interval: 1,
          endDate: undefined, // 종료일 미지정
        },
      } as Event;

      const dates = generateDailyDates(dailyEvent);

      // 마지막 날짜가 2025-09-30 이어야 한다
      expect(dates[dates.length - 1]).toBe('2025-09-30');
      // 9/22 ~ 9/30 총 9일치
      expect(dates).toHaveLength(9);
      // 시작일 검증
      expect(dates[0]).toBe(start);
    });
  });

  describe('반복 일정 단일 수정', () => {
    it('반복 일정을 수정하면 단일 일정으로 변경 되어야 한다', async () => {
      // 1) MSW에 초기 반복 이벤트와 업데이트 핸들러 등록
      const recurringEvent: Event = {
        id: '1',
        title: '주간 회의',
        date: '2025-10-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29' },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => HttpResponse.json({ events: [recurringEvent] })),
        http.put('/api/events/1', async ({ request }) => {
          const updated = (await request.json()) as Event;
          return HttpResponse.json(updated);
        })
      );

      // 2) 렌더링 & userEvent 준비
      const { user } = setup(<App />);

      // 3) 이벤트 리스트 영역 가져오기
      const list = screen.getByTestId('event-list');

      // 4) “주간 회의” 텍스트가 리스트 안에 나타날 때까지 대기
      await waitFor(() => {
        expect(within(list).getByText('주간 회의')).toBeInTheDocument();
      });

      // 반복 일정 텍스트가 보일 때까지 기다렸다가 검증
      await waitFor(() => {
        // 사이드 리스트에 “반복:” 으로 시작하는 문구가 있어야 합니다.
        expect(within(list).getByText(/^반복:.*마다/)).toBeInTheDocument();
      });

      // 6) 편집 모드 진입
      await user.click(within(list).getByLabelText('Edit event'));

      // 7) 반복 체크박스 해제
      const repeatCheckbox = screen.getByLabelText('반복 설정');
      expect(repeatCheckbox).toBeChecked();
      await user.click(repeatCheckbox);
      expect(repeatCheckbox).not.toBeChecked();

      // 8) 저장
      await user.click(screen.getByTestId('event-submit-button'));

      // 9) 저장 후 리스트 안에서 반복 아이콘이 사라졌는지 확인
      await waitFor(() => {
        expect(within(list).queryByTestId('repeat-icon')).toBeNull();
      });
    });

    it('반복 일정을 수정하면 반복 아이콘이 사라져야 한다', async () => {
      const recurringEvent: Event = {
        id: '1',
        title: '주간 회의',
        date: '2025-10-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29' },
        notificationTime: 10,
      };

      // 1) 초기 GET 이벤트(반복 있는 상태)
      server.use(
        http.get('/api/events', () => HttpResponse.json({ events: [recurringEvent] })),
        // 2) PUT/UPDATE 핸들러: repeat를 none으로 바꿔서 반환
        http.put('/api/events/1', async ({ request }) => {
          const updated = (await request.json()) as Event;
          return HttpResponse.json({ ...updated, repeat: { type: 'none', interval: 0 } });
        })
      );

      const { user } = setup(<App />);
      const list = screen.getByTestId('event-list');

      // 로드된 반복 이벤트 확인
      await waitFor(() => {
        expect(within(list).getByText('주간 회의')).toBeInTheDocument();
        expect(within(list).getByText(/^반복:/)).toBeInTheDocument();
      });

      // 편집 진입 & 반복 해제
      await user.click(within(list).getByLabelText('Edit event'));
      const repeatCheckbox = screen.getByLabelText('반복 설정');
      await user.click(repeatCheckbox);
      expect(repeatCheckbox).not.toBeChecked();

      // 3) **저장 전에** GET 핸들러를 바꿔서 “반복 해제된” 데이터를 내려주도록 override**
      server.use(
        http.get('/api/events', () =>
          HttpResponse.json({
            events: [
              {
                ...recurringEvent,
                repeat: { type: 'none', interval: 0 },
              },
            ],
          })
        )
      );

      // 저장
      await user.click(screen.getByTestId('event-submit-button'));

      // 4) 저장 후 UI에서 “반복:” 텍스트가 사라지는지 확인
      await waitFor(() => {
        expect(within(list).queryByText(/^반복:/)).toBeNull();
      });
    });
    it('반복 일정을 수정할 때 다른 반복 일정들은 영향을 받지 않아야 한다.', async () => {
      // 1) 두 개의 동일한 series ID를 가진 반복 이벤트를 준비
      const baseRepeatId = 'series-123';
      const event1: Event = {
        id: '1',
        title: 'Weekly A',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29', id: baseRepeatId },
        notificationTime: 10,
      };
      const event2: Event = {
        id: '2',
        title: 'Weekly B',
        date: '2025-10-08',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29', id: baseRepeatId },
        notificationTime: 10,
      };

      // 2) 초기 GET 핸들러: 두 이벤트를 내려준다
      server.use(
        http.get('/api/events', () => HttpResponse.json({ events: [event1, event2] })),
        // 3) PUT /api/events/2 처리: 단일 event2만 repeat 해제하여 반환
        http.put('/api/events/2', async ({ request }) => {
          const updated = (await request.json()) as Event;
          return HttpResponse.json({
            ...updated,
            repeat: { type: 'none', interval: 0 },
          });
        })
      );

      // 4) 렌더링 & userEvent 준비
      const { user } = setup(<App />);
      const list = screen.getByTestId('event-list');

      // 5) 두 이벤트가 보일 때까지 대기 & 둘 다 “반복:” 표시 확인
      await waitFor(() => {
        expect(within(list).getByText('Weekly A')).toBeInTheDocument();
        expect(within(list).getByText('Weekly B')).toBeInTheDocument();
        // 두 아이템 모두에 대해 “반복:” 텍스트가 있어야 한다
        expect(within(list).getAllByText(/^반복:/)).toHaveLength(2);
      });

      // 6) event2만 편집 모드로 진입
      const editButtons = within(list).getAllByLabelText('Edit event');
      await user.click(editButtons[1]);

      // 7) 반복 해제 체크박스 해제
      const repeatCheckbox = screen.getByLabelText('반복 설정');
      await user.click(repeatCheckbox);
      expect(repeatCheckbox).not.toBeChecked();

      // 8) 저장 직전, GET 핸들러를 오버라이드하여
      //    event2는 repeat:none, event1은 그대로 반복인 상태를 내려주도록 설정
      server.use(
        http.get('/api/events', () =>
          HttpResponse.json({
            events: [
              event1, // unchanged
              { ...event2, repeat: { type: 'none', interval: 0 } },
            ],
          })
        )
      );

      // 9) 저장
      await user.click(screen.getByTestId('event-submit-button'));

      // 10) 저장 후, event1은 여전히 “반복:” 텍스트가 남아 있고,
      //     event2 박스에서는 “반복:” 텍스트가 사라졌는지를 검증
      await waitFor(() => {
        const allRepeats = within(list).queryAllByText(/^반복:/);
        // event1 한 개만 남아야 한다
        expect(allRepeats).toHaveLength(1);

        const event2NewBox = within(list).getByText('Weekly B').closest('div')!;
        expect(within(event2NewBox).queryByText(/^반복:/)).toBeNull();
      });
    });
  });

  // 여기부터는 추가사항
  describe('반복 일정 단일 삭제', () => {
    it('반복 일정을 삭제하면 해당 일정만 삭제되어야 한다', async () => {
      // 1) 동일한 seriesId를 가진 4개의 반복 이벤트 생성
      const seriesId = randomUUID();
      const base = {
        title: '반복 일정',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '',
        notificationTime: 10,
      } as const;
      const eventA: Event = {
        ...base,
        id: 'a1',
        date: '2025-10-01',
        repeat: { id: seriesId, type: 'weekly', interval: 1, endDate: '2025-10-29' },
      };
      const eventB: Event = {
        ...base,
        id: 'b2',
        date: '2025-10-08',
        repeat: { id: seriesId, type: 'weekly', interval: 1, endDate: '2025-10-29' },
      };
      const eventC: Event = {
        ...base,
        id: 'c3',
        date: '2025-10-15',
        repeat: { id: seriesId, type: 'weekly', interval: 1, endDate: '2025-10-29' },
      };
      const eventD: Event = {
        ...base,
        id: 'd4',
        date: '2025-10-22',
        repeat: { id: seriesId, type: 'weekly', interval: 1, endDate: '2025-10-29' },
      };

      // 2) MSW 핸들러 설정: GET /api/events, DELETE /api/events/:id
      let mockEvents = [eventA, eventB, eventC, eventD];
      server.use(
        http.get('/api/events', () => HttpResponse.json({ events: mockEvents })),
        http.delete('/api/events/:id', ({ params }) => {
          // 삭제 요청이 들어오면 해당 id만 mockEvents에서 제거
          mockEvents = mockEvents.filter((e) => e.id !== params.id);
          return new HttpResponse(null, { status: 204 });
        })
      );

      // 3) 렌더링 & userEvent 준비
      const { user } = setup(<App />);

      // 4) 리스트에 A, B, C, D 모두 보일 때까지 대기
      const list = await screen.findByTestId('event-list');
      await waitFor(() => {
        ['반복 일정', '반복 일정', '반복 일정', '반복 일정'].forEach((_, i) => {
          // 같은 제목이 네 번 나오므로 nth-match 대신 그냥 네 개가 있는지 체크
          expect(within(list).getAllByText('반복 일정')).toHaveLength(4);
        });
      });

      // 5) 두 번째 항목(eventB)에 해당하는 삭제 버튼을 클릭
      const deleteButtons = within(list).getAllByLabelText('Delete event');
      await user.click(deleteButtons[1]);

      // 6) 삭제 후 UI 업데이트 대기 및 검증
      await waitFor(() => {
        // b2가 삭제되어 B에 대응하는 텍스트 하나가 사라져야 함
        expect(mockEvents.map((e) => e.id)).not.toContain('b2');
        // 화면에는 이제 3개의 반복 일정만 남아야 함
        expect(within(list).getAllByText('반복 일정')).toHaveLength(3);
        // A, C, D는 여전히 보여야 함
        expect(within(list).getByText('2025-10-01')).toBeInTheDocument();
        expect(within(list).getByText('2025-10-15')).toBeInTheDocument();
        expect(within(list).getByText('2025-10-22')).toBeInTheDocument();
      });
    });
  });
});
