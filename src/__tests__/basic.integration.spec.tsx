import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupMockHandlerEventsListCreation } from '../__mocks__/handlersUtils';
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

  // describe('반복 일정 수정', () => {
  //   it('반복 일정 중 하나를 수정하면 반복 속성이 제거되고 반복 아이콘이 사라진다', async () => {
  //     const { user } = setup(<App />);

  //     // 1. 반복 일정 생성
  //     await user.click(screen.getByText('일정 추가'));
  //     await user.type(screen.getByLabelText('제목'), '반복 회의');
  //     await user.type(screen.getByLabelText('날짜'), '2025-05-01');
  //     await user.type(screen.getByLabelText('시작 시간'), '09:00');
  //     await user.type(screen.getByLabelText('종료 시간'), '10:00');
  //     await user.type(screen.getByLabelText('설명'), '수정 전');
  //     await user.type(screen.getByLabelText('위치'), '회의실');
  //     await user.selectOptions(screen.getByLabelText('카테고리'), '업무');
  //     await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');
  //     await user.type(screen.getByLabelText('반복 종료일'), '2025-05-03');
  //     await user.click(screen.getByTestId('event-submit-button'));

  //     // 2. 수정할 이벤트 선택
  //     const eventList = within(screen.getByTestId('event-list'));
  //     const editButtons = await screen.findAllByLabelText('Edit event');
  //     await user.click(editButtons[0]); // 첫 번째 반복 일정 수정

  //     // 3. 제목 수정 → 반복 속성 제거됨
  //     await user.clear(screen.getByLabelText('제목'));
  //     await user.type(screen.getByLabelText('제목'), '수정된 일정');
  //     await user.click(screen.getByTestId('event-submit-button'));

  //     // 4. 리스트에 수정된 일정이 존재함
  //     expect(eventList.getByText('수정된 일정')).toBeInTheDocument();

  //     // 5. 수정된 일정에는 반복 아이콘이 없어야 함
  //     const updatedRow = eventList.getByText('수정된 일정').closest('[data-event]') as HTMLElement;
  //     const repeatIcon = within(updatedRow).queryByTestId('repeat-icon');
  //     expect(repeatIcon).not.toBeInTheDocument();
  //   });
  // });

  // describe('반복 일정 단일 삭제', () => {
  //   it('반복 일정 중 하나를 삭제하면 해당 일정만 사라지고 나머지는 유지된다', async () => {
  //     const { user } = setup(<App />);

  //     // 1. 반복 일정 생성
  //     await user.click(screen.getByText('일정 추가'));
  //     await user.type(screen.getByLabelText('제목'), '반복 회의');
  //     await user.type(screen.getByLabelText('날짜'), '2025-05-01');
  //     await user.type(screen.getByLabelText('시작 시간'), '09:00');
  //     await user.type(screen.getByLabelText('종료 시간'), '10:00');
  //     await user.type(screen.getByLabelText('설명'), '삭제 테스트');
  //     await user.type(screen.getByLabelText('위치'), '회의실');
  //     await user.selectOptions(screen.getByLabelText('카테고리'), '업무');
  //     await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');
  //     await user.type(screen.getByLabelText('반복 종료일'), '2025-05-03');
  //     await user.click(screen.getByTestId('event-submit-button'));

  //     const eventList = within(screen.getByTestId('event-list'));

  //     // 2. 반복 일정이 3개 렌더링되었는지 확인
  //     await screen.findAllByText('반복 회의');
  //     expect(eventList.getAllByText('반복 회의')).toHaveLength(3);

  //     // 3. 첫 번째 일정 삭제
  //     const deleteButtons = await screen.findAllByLabelText('Delete event');
  //     await user.click(deleteButtons[0]);

  //     // 4. 삭제 후 2개만 남아 있어야 함
  //     await waitFor(() => {
  //       expect(eventList.getAllByText('반복 회의')).toHaveLength(2);
  //     });
  //   });
  // });
});
