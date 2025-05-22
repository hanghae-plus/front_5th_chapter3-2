import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';

import { setupMockHandlers } from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';

const setup = () => {
  const user = userEvent.setup();
  return {
    user,
    ...render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    ),
  };
};

describe('반복 일정 표시 기능 테스트', () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date('2024-05-20'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('캘린더 뷰에서 반복 일정이 시각적으로 구분되어 표시된다', async () => {
    // 반복 일정 생성 및 저장
    const mockEvents = setupMockHandlers();
    const { user } = setup();

    // 일정 로딩 완료 메시지 확인
    await screen.findByText('일정 로딩 완료!');

    // 일정 기본 정보 입력
    await user.type(screen.getByLabelText('제목'), '반복 일정');
    await user.type(screen.getByLabelText('날짜'), '2024-05-20');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '15:00');
    await user.type(screen.getByLabelText('설명'), '매주 반복되는 일정');
    await user.type(screen.getByLabelText('위치'), '회의실 B');
    await user.selectOptions(screen.getByLabelText('카테고리'), '업무');

    // 반복 일정 체크박스 선택
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    await act(async () => {
      await user.click(repeatCheckbox);
    });

    // 반복 유형 선택 (매주)
    await user.selectOptions(screen.getByLabelText('반복 유형'), 'weekly');

    // 반복 간격 설정
    const repeatIntervalInput = screen.getByLabelText('반복 간격');
    await user.clear(repeatIntervalInput);
    await user.type(repeatIntervalInput, '1');

    // 반복 종료일 설정
    await user.type(screen.getByLabelText('반복 종료일'), '2024-06-30');

    // 일정 저장 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // 저장 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    // 이벤트 목록에서 반복 일정 확인
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('반복 일정')).toBeInTheDocument();

    // 월별 뷰 선택
    await user.selectOptions(screen.getByLabelText('view'), 'month');

    // 월별 뷰에서 반복 아이콘 확인
    const monthView = within(screen.getByTestId('month-view'));
    const repeatEvents = monthView.getAllByText('반복 일정');

    // 반복 아이콘 확인
    const parentElement = repeatEvents[0].parentElement;
    expect(parentElement?.querySelector('[data-testid="repeat-icon"]')).toBeInTheDocument();
  });
});
