import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import App from '../App';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

describe('반복 일정 CRUD 테스트', () => {
  describe('반복 일정 생성', () => {
    it('반복 일정이 생성되면 여러 날짜에 일정이 표시되고 반복 아이콘이 함께 노출된다', async () => {
      const { user } = setup(<App />);

      await user.click(screen.getByText('일정 추가'));

      await user.type(screen.getByLabelText('제목'), '반복 회의');
      await user.type(screen.getByLabelText('날짜'), '2025-05-01');
      await user.type(screen.getByLabelText('시작 시간'), '09:00');
      await user.type(screen.getByLabelText('종료 시간'), '10:00');
      await user.type(screen.getByLabelText('설명'), '설명');
      await user.type(screen.getByLabelText('위치'), '회의실');
      await user.selectOptions(screen.getByLabelText('카테고리'), '업무');

      await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');
      await user.type(screen.getByLabelText('반복 종료일'), '2025-05-03');

      await user.click(screen.getByTestId('event-submit-button'));

      const eventList = within(screen.getByTestId('event-list'));

      // 반복 일정이 여러 개 렌더링되는지 확인
      const allEvents = eventList.getAllByText('반복 회의');
      expect(allEvents.length).toBe(3);

      // 반복 일정에 repeat-icon이 붙는지 확인
      const repeatIcons = eventList.getAllByTestId('repeat-icon');
      expect(repeatIcons.length).toBe(3);
    });
  });

  describe('반복 일정 수정', () => {
    it('반복 일정 중 하나를 수정하면 반복 속성이 제거되고 반복 아이콘이 사라진다', async () => {
      const { user } = setup(<App />);

      // 1. 반복 일정 생성
      await user.click(screen.getByText('일정 추가'));
      await user.type(screen.getByLabelText('제목'), '반복 회의');
      await user.type(screen.getByLabelText('날짜'), '2025-05-01');
      await user.type(screen.getByLabelText('시작 시간'), '09:00');
      await user.type(screen.getByLabelText('종료 시간'), '10:00');
      await user.type(screen.getByLabelText('설명'), '수정 전');
      await user.type(screen.getByLabelText('위치'), '회의실');
      await user.selectOptions(screen.getByLabelText('카테고리'), '업무');
      await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');
      await user.type(screen.getByLabelText('반복 종료일'), '2025-05-03');
      await user.click(screen.getByTestId('event-submit-button'));

      // 2. 수정할 이벤트 선택
      const eventList = within(screen.getByTestId('event-list'));
      const editButtons = await screen.findAllByLabelText('Edit event');
      await user.click(editButtons[0]); // 첫 번째 반복 일정 수정

      // 3. 제목 수정 → 반복 속성 제거됨
      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 일정');
      await user.click(screen.getByTestId('event-submit-button'));

      // 4. 리스트에 수정된 일정이 존재함
      expect(eventList.getByText('수정된 일정')).toBeInTheDocument();

      // 5. 수정된 일정에는 반복 아이콘이 없어야 함
      const updatedRow = eventList.getByText('수정된 일정').closest('[data-event]') as HTMLElement;
      const repeatIcon = within(updatedRow).queryByTestId('repeat-icon');
      expect(repeatIcon).not.toBeInTheDocument();
    });
  });

  describe('반복 일정 단일 삭제', () => {
    it('단일 일정을 삭제하면 해당 일정만 /api/events/:id로 삭제 요청된다', () => {});
    it('삭제된 일정은 화면에서 사라지고, 나머지는 유지된다', () => {});
  });
});
