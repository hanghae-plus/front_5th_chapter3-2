import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import App from '../App';

describe('반복일정 캘린더 표시', () => {
  it('반복일정이 Week & Month view에 표시된다', async () => {
    const user = userEvent.setup();
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );

    // 일정 추가
    await user.type(screen.getByLabelText('제목'), '반복 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-10');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '반복 설명');
    await user.type(screen.getByLabelText('위치'), '회의실');
    await user.selectOptions(screen.getByLabelText('카테고리'), '업무');

    // 반복 일정 체크
    await user.click(screen.getByText('반복 일정'));
    await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), '1');
    await user.type(screen.getByLabelText('반복 종료일'), '2025-10-13');

    await user.click(screen.getByTestId('event-submit-button'));

    // Week view에서 반복 일정이 여러 날짜에 표시되는지 확인
    await user.selectOptions(screen.getByLabelText('view'), 'week');
    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getAllByText('반복 테스트').length).toBeGreaterThanOrEqual(3);

    // Month View에서 반복 일정이 여러 날짜에 표시되는지 확인
    await user.selectOptions(screen.getByLabelText('view'), 'month');
    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getAllByText('반복 테스트').length).toBeGreaterThanOrEqual(3);
  });
});