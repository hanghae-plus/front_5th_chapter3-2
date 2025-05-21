import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import {
  setupMockHandlerCreation,
  setupMockHandlerRepeatingEvents,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event, EventForm } from '../types';
// * 8주차 기본과제 - TDD
describe('8th basic integration test - 반복 일정', () => {
  const renderComponent = () => {
    return render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  };

  const mockEvents: Event[] = [
    {
      id: '1',
      title: '팀 회의',
      date: '2024-02-03',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 회의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '점심 약속',
      date: '2024-02-04',
      startTime: '12:00',
      endTime: '13:00',
      description: '친구와 점심 식사',
      location: '수원역',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '3',
      title: '운동',
      date: '2024-02-08',
      startTime: '12:00',
      endTime: '14:30',
      description: '주간 운동',
      location: '헬스장',
      category: '개인',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    },
    {
      id: '4',
      title: '운동',
      date: '2024-02-15',
      startTime: '12:00',
      endTime: '14:30',
      description: '주간 운동',
      location: '헬스장',
      category: '개인',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    },
  ];

  const formData: EventForm = {
    title: '스터디',
    date: '2024-02-05',
    startTime: '12:00',
    endTime: '14:30',
    description: '스터디 모임',
    location: '스터디 장소',
    category: '개인',
    repeat: { type: 'daily', interval: 1 },
    notificationTime: 10,
  };

  beforeEach(() => {
    vi.setSystemTime(new Date('2024-02-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe.skip('반복 일정 기본 테스트', () => {
    it('일정 생성 시 반복 일정들이 캘린더에 정확히 표시된다.', async () => {
      const { handler, getHandler } = setupMockHandlerRepeatingEvents(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      // * 1. 기본 정보 입력
      await user.type(screen.getByLabelText('제목'), formData.title);
      await user.type(screen.getByLabelText('날짜'), formData.date);
      await user.type(screen.getByLabelText('시작 시간'), formData.startTime);
      await user.type(screen.getByLabelText('종료 시간'), formData.endTime);
      await user.type(screen.getByLabelText('설명'), formData.description);
      await user.type(screen.getByLabelText('위치'), formData.location);
      await user.selectOptions(screen.getByLabelText('카테고리'), formData.category);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'weekly');

      // * 4. 반복 간격 선택
      const repeatIntervalSelector = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelector);
      await user.type(repeatIntervalSelector, '1');

      // * 5. 종료 날짜 선택
      const endDateSelector = screen.getByLabelText('반복 종료일');
      await user.type(endDateSelector, '2024-02-28');

      // * 6. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      // * 7. 결과 확인
      const eventList = await screen.findByTestId('event-list');
      expect(within(eventList).getAllByText(formData.title).length).toBe(4);
      expect(within(eventList).getAllByText(formData.title)[0]).toBeInTheDocument();
      expect(within(eventList).getAllByText(/1.*주.*마다/)[0]).toBeInTheDocument();
    });
    it('윤달의 마지막 날 이벤트를 반복 설정할 시 경고 Modal이 표시된다.', async () => {
      const { handler, getHandler } = setupMockHandlerCreation(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      const leapDayDateString = '2024-02-29';

      // * 1. 기본 정보 입력
      await user.type(screen.getByLabelText('제목'), formData.title);
      await user.type(screen.getByLabelText('날짜'), leapDayDateString);
      await user.type(screen.getByLabelText('시작 시간'), formData.startTime);
      await user.type(screen.getByLabelText('종료 시간'), formData.endTime);
      await user.type(screen.getByLabelText('설명'), formData.description);
      await user.type(screen.getByLabelText('위치'), formData.location);
      await user.selectOptions(screen.getByLabelText('카테고리'), formData.category);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'yearly');

      // * 4. 반복 간격 선택
      const repeatIntervalSelector = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelector);
      await user.type(repeatIntervalSelector, '1');

      // * 5. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      const alertHeader = await screen.findByText('윤달 반복 경고');
      const alertBodyText = await screen.findByText(
        `${formData.title} (${leapDayDateString} ${formData.startTime}-${formData.endTime})`
      );

      const alertDialog = await screen.findByRole('alertdialog');

      expect(alertHeader).toBeInTheDocument();
      expect(alertBodyText).toBeInTheDocument();
      expect(alertDialog).toBeInTheDocument();
    });
    it('31일 이벤트를 반복 설정할 시 경고 Modal이 표시된다.', async () => {
      const { handler, getHandler } = setupMockHandlerCreation(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      // * 1. 기본 정보 입력
      await user.type(screen.getByLabelText('제목'), formData.title);
      await user.type(screen.getByLabelText('날짜'), '2024-03-31');
      await user.type(screen.getByLabelText('시작 시간'), formData.startTime);
      await user.type(screen.getByLabelText('종료 시간'), formData.endTime);
      await user.type(screen.getByLabelText('설명'), formData.description);
      await user.type(screen.getByLabelText('위치'), formData.location);
      await user.selectOptions(screen.getByLabelText('카테고리'), formData.category);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'monthly');

      // * 4. 반복 간격 선택
      const repeatIntervalSelector = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelector);
      await user.type(repeatIntervalSelector, '3');

      // * 5. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      const alertHeader = await screen.findByText('31일 반복 일정 경고');
      const alertDialog = await screen.findByRole('alertdialog');

      expect(alertHeader).toBeInTheDocument();
      expect(alertDialog).toBeInTheDocument();
    });
  });

  describe.skip('1. (필수) 반복 유형 선택', () => {
    it('일정 생성 시 반복 유형을 선택할 수 있다.', async () => {
      const { handler, getHandler } = setupMockHandlerRepeatingEvents(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      // * 1. 기본 정보 입력
      await user.type(screen.getByLabelText('제목'), formData.title);
      await user.type(screen.getByLabelText('날짜'), formData.date);
      await user.type(screen.getByLabelText('시작 시간'), formData.startTime);
      await user.type(screen.getByLabelText('종료 시간'), formData.endTime);
      await user.type(screen.getByLabelText('설명'), formData.description);
      await user.type(screen.getByLabelText('위치'), formData.location);
      await user.selectOptions(screen.getByLabelText('카테고리'), formData.category);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'daily');

      // * 4. 반복 간격 선택
      const repeatIntervalSelector = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelector);
      await user.type(repeatIntervalSelector, '1');

      // * 5. 반복 종료일 선택
      const repeatEndDateSelector = screen.getByLabelText('반복 종료일');
      await user.type(repeatEndDateSelector, '2024-02-02');

      // * 6. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // * 5. 결과 확인
      const eventList = await screen.findByTestId('event-list');
      expect(within(eventList).getAllByText(formData.title)).toHaveLength(1);
      expect(within(eventList).getByText(/1.*일.*마다/)).toBeInTheDocument();
    });
    it('일정 수정 시 반복 유형을 선택할 수 있다.', async () => {
      const { handler, getHandler } = setupMockHandlerUpdating(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      // * 1. 수정 버튼 클릭
      const eventItem = await screen.findByTestId(`event-item-${mockEvents[0].id}`);
      const editButton = within(eventItem).getByLabelText('Edit event');
      expect(editButton).toBeInTheDocument();
      await user.click(editButton);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'weekly');

      // * 4. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // * 5. 결과 확인
      const eventList = await screen.findByTestId('event-list');
      expect(within(eventList).getByText(mockEvents[0].title)).toBeInTheDocument();
      expect(within(eventList).getByText(/0.*주.*마다/)).toBeInTheDocument();
    });
  });

  describe.skip('2. (필수) 반복 간격 설정', () => {
    it('일정 생성 시 반복 간격을 선택할 수 있다.', async () => {
      const { handler, getHandler } = setupMockHandlerRepeatingEvents(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      // * 1. 기본 정보 입력
      await user.type(screen.getByLabelText('제목'), formData.title);
      await user.type(screen.getByLabelText('날짜'), formData.date);
      await user.type(screen.getByLabelText('시작 시간'), formData.startTime);
      await user.type(screen.getByLabelText('종료 시간'), formData.endTime);
      await user.type(screen.getByLabelText('설명'), formData.description);
      await user.type(screen.getByLabelText('위치'), formData.location);
      await user.selectOptions(screen.getByLabelText('카테고리'), formData.category);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'monthly');

      // * 4. 반복 간격 선택
      const repeatIntervalSelector = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelector);
      await user.type(repeatIntervalSelector, '2');

      // * 5. 반복 종료일 선택
      const repeatEndDateSelector = screen.getByLabelText('반복 종료일');
      await user.type(repeatEndDateSelector, '2024-04-04');

      // * 6. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // * 7. 결과 확인
      const eventList = await screen.findByTestId('event-list');
      expect(within(eventList).getByText(formData.title)).toBeInTheDocument();
      expect(within(eventList).getByText(/2.*월.*마다/)).toBeInTheDocument();
    });
    it('일정 수정 시 반복 간격을 선택할 수 있다.', async () => {
      const { handler, getHandler } = setupMockHandlerUpdating(mockEvents);
      server.use(handler, getHandler);
      const user = userEvent.setup();
      renderComponent();

      // * 1. 수정 버튼 클릭
      const eventItem = await screen.findByTestId(`event-item-${mockEvents[0].id}`);
      const editButton = within(eventItem).getByLabelText('Edit event');
      expect(editButton).toBeInTheDocument();
      await user.click(editButton);

      // * 2. 반복 설정
      const isRepeatingCheckbox = screen.getByLabelText('반복 설정');
      await user.click(isRepeatingCheckbox);

      // * 3. 반복 유형 선택
      const repeatTypeSelector = screen.getByLabelText('반복 유형');
      await user.selectOptions(repeatTypeSelector, 'yearly');

      // * 4. 반복 간격 선택
      const repeatIntervalSelector = screen.getByLabelText('반복 간격');
      await user.clear(repeatIntervalSelector);
      await user.type(repeatIntervalSelector, '4');

      // * 5. 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // * 6. 결과 확인
      const eventList = await screen.findByTestId('event-list');
      expect(within(eventList).getByText(mockEvents[0].title)).toBeInTheDocument();
      expect(within(eventList).getByText(/4.*년.*마다/)).toBeInTheDocument();
    });
  });

  describe.skip('3. (필수) 반복 일정 표시', () => {
    it('캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다', async () => {
      expect(true).toBe(true);
    });
    it('일정 생성 시 반복 일정이 정확히 표시된다.', async () => {
      expect(true).toBe(true);
    });
    it('일정 수정 시 반복 일정이 정확히 표시된다.', async () => {
      expect(true).toBe(true);
    });
  });

  describe.skip('4. (필수) 반복 종료', () => {
    it('일정 생성 시 반복 종료일을 선택할 수 있다.', async () => {});
    it('일정 수정 시 반복 종료일을 선택할 수 있다.', async () => {});
  });

  describe.skip('5. (필수) 반복 일정 단일 수정', () => {
    it('반복일정을 수정하면 단일 일정으로 변경됩니다.', async () => {});
    it('반복일정을 수정하면 반복일정 아이콘도 사라집니다.', async () => {});
  });

  describe.skip('6. (필수) 반복 일정 삭제', () => {
    it('반복일정을 삭제하면 해당 일정만 삭제됩니다.', async () => {});
  });
});
