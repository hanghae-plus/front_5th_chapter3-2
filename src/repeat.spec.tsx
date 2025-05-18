import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';

import { setupMockHandlerCreation, setupMockHandlerUpdating } from './__mocks__/handlersUtils';
import App from './App';
import { Event, EventForm } from './types';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

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
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
  await user.type(screen.getByLabelText('반복 간격'), repeat.interval.toString());
  await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate || '');

  await user.click(screen.getByTestId('event-submit-button'));
};

const MOCK_EVENTS: Event[] = [
  {
    id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
    title: '팀 회의',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: 'da3ca408-836a-4d98-b67a-ca389d07552b',
    title: '프로젝트 마감',
    date: '2025-05-25',
    startTime: '09:00',
    endTime: '18:00',
    description: '분기별 프로젝트 마감',
    location: '사무실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: 'dac62941-69e5-4ec0-98cc-24c2a79a7f81',
    title: '생일 파티',
    date: '2025-06-01',
    startTime: '19:00',
    endTime: '22:00',
    description: '친구 생일 축하',
    location: '친구 집',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: '80d85368-b4a4-47b3-b959-25171d49371f',
    title: '운동',
    date: '2025-05-21',
    startTime: '18:00',
    endTime: '19:00',
    description: '주간 운동',
    location: '헬스장',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
];

describe('반복 정보를 포함하여 새 일정을 추가한다.', () => {
  it('사용자가 "일정 생성" 시 반복 유형을 선택할 수 있다.', async () => {
    const { user } = setup(<App />);

    expect(screen.getByLabelText('반복 유형')).toBeInTheDocument();
    expect(screen.getByLabelText('반복 간격')).toBeInTheDocument();
    expect(screen.getByLabelText('반복 종료일')).toBeInTheDocument();

    expect(screen.getByRole('option', { name: '매일' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '매주' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '매월' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '매년' })).toBeInTheDocument();

    const repeatTypeSelector = screen.getByTestId('repeat-type-selector');
    await user.selectOptions(repeatTypeSelector, '매일');
    expect(repeatTypeSelector).toHaveValue('daily');
  });

  it('월별 뷰에 반복되는 일정이 표시된다.', async () => {
    vi.setSystemTime(new Date('2025-05-01'));
    setupMockHandlerCreation();
    const { user } = setup(<App />);

    const newEvent: EventForm = {
      title: '과제 하기',
      date: '2025-05-18',
      startTime: '13:00',
      endTime: '18:00',
      description: '항해플러스 프론트엔드5기 8주차 발제 과제',
      location: '우리집',
      category: '개인',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-23' },
      notificationTime: 10,
    };

    await saveSchedule(user, newEvent);

    const monthView = within(screen.getByTestId('month-view'));
    const allEvents = await monthView.findAllByText(newEvent.title);
    expect(allEvents).toHaveLength(6);
  });
});

describe('반복 정보를 포함하여 기존 일정을 수정한다.', () => {
  it('사용자가 "일정 수정" 시 반복 유형을 선택할 수 있다.', async () => {
    const { user } = setup(<App />);
    setupMockHandlerUpdating();

    const editButton = (await screen.findAllByLabelText('Edit event'))[0];
    await user.click(editButton);

    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    const repeatTypeSelector = screen.getByTestId('repeat-type-selector');
    await user.selectOptions(repeatTypeSelector, '매주');
    expect(repeatTypeSelector).toHaveValue('weekly');
  });

  it('월별 뷰에 반복되는 일정이 표시된다.', async () => {
    const { user } = setup(<App />);
    setupMockHandlerUpdating();

    await user.click((await screen.findAllByLabelText('Edit event'))[0]);

    await user.selectOptions(screen.getByLabelText('반복 유형'), '매일');
    await user.type(screen.getByLabelText('반복 간격'), '1');
    await user.type(screen.getByLabelText('반복 종료일'), '2025-10-20');

    await user.click(screen.getByTestId('event-submit-button'));

    const monthView = within(screen.getByTestId('month-view'));
    const allEvents = await monthView.findAllByText('기존 회의');
    expect(allEvents).toHaveLength(6);
  });
});
