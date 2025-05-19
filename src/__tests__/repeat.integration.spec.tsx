import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';

const renderApp = () => {
  render(
    <ChakraProvider>
      <App />
    </ChakraProvider>
  );
};

describe('repeat.integration.spec.ts', () => {
  const newEvent: Event = {
    id: '1',
    title: '매일 반복 이벤트',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'weekly', interval: 1, endDate: '2025-06-03' },
    notificationTime: 10,
  };

  it('이벤트 조회 시 반복 정보가 적용된다', async () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json([newEvent]);
      })
    );

    renderApp();
    const list = await screen.findByTestId('event-list');
    expect(within(list).getAllByText(newEvent.title).length).toBeGreaterThan(1);
  });

  it('이벤트 생성 시 반복 정보가 적용된다', async () => {
    setupMockHandlerCreation([...newEvent]);
    renderApp();
    const user = userEvent.setup();

    await user.click(screen.getAllByText('일정 추가')[0]);
    await user.type(screen.getByLabelText('제목'), newEvent.title);
    await user.type(screen.getByLabelText('날짜'), newEvent.date);
    await user.type(screen.getByLabelText('시작 시간'), newEvent.startTime);
    await user.type(screen.getByLabelText('종료 시간'), newEvent.endTime);
    await user.type(screen.getByLabelText('설명'), newEvent.description);
    await user.type(screen.getByLabelText('위치'), newEvent.location);
    await user.selectOptions(screen.getByLabelText('카테고리'), newEvent.category);
    await user.selectOptions(
      screen.getByLabelText('알림 설정'),
      newEvent.notificationTime.toString()
    );

    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    await user.click(repeatCheckbox);
    await user.selectOptions(screen.getByLabelText('반복 유형'), newEvent.repeat.type);
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), newEvent.repeat.interval.toString());
    await user.type(screen.getByLabelText('반복 종료일'), newEvent.repeat.endDate!);

    await user.click(screen.getByRole('button', { name: '일정 추가' }));

    const list = await screen.findByTestId('event-list');
    expect(within(list).getAllByText(newEvent.title).length).toBeGreaterThan(1);
  });

  it('이벤트 수정 시 반복 정보가 적용된다', async () => {
    setupMockHandlerUpdating();
    renderApp();
    const user = userEvent.setup();

    const editButton = await screen.findAllByLabelText('Edit event');
    await user.click(editButton[0]);
    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 이벤트');
    await user.click(screen.getByTestId('event-submit-button'));

    const list = screen.getByTestId('event-list');
    expect(within(list).getByText('수정된 이벤트')).toBeInTheDocument();
  });

  it('이벤트 삭제 시 반복 정보가 적용된다', async () => {
    setupMockHandlerDeletion();
    renderApp();
    const user = userEvent.setup();

    const deleteButtons = await screen.findAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    const list = screen.getByTestId('event-list');
    expect(within(list).queryByText(newEvent.title)).not.toBeInTheDocument();
  });
});
