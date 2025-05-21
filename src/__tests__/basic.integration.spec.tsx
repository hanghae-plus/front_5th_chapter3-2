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

  describe('반복 일정 단일 수정', () => {
    it('단일 일정을 수정하면 repeat.type이 none으로 변경된다', () => {});
    it('수정된 일정은 반복 아이콘이 표시되지 않는다', () => {});
    it('수정된 일정만 /api/events/:id로 PUT 요청된다', () => {});
  });

  describe('반복 일정 단일 삭제', () => {
    it('단일 일정을 삭제하면 해당 일정만 /api/events/:id로 삭제 요청된다', () => {});
    it('삭제된 일정은 화면에서 사라지고, 나머지는 유지된다', () => {});
  });
});
