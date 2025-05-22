import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/** 1. 반복 유형 선택*/
describe('반복 유형 선택 통합 테스트', () => {
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

  // 반복 일정 체크박스 선택 테스트
  it('반복 일정 체크박스를 선택하면 반복 관련 설정이 표시되어야 한다', async () => {
    setupMockHandlers();
    const { user } = setup();

    // 일정 로딩 완료 메시지 확인
    await screen.findByText('일정 로딩 완료!');

    // 반복 일정 체크박스 찾기
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;

    // 체크박스가 기본적으로 선택되지 않은 상태인지 확인
    expect(repeatCheckbox).not.toBeChecked();

    // 체크박스 선택
    await act(async () => {
      await user.click(repeatCheckbox);
    });

    // 반복 관련 설정이 표시되는지 확인
    expect(screen.getByLabelText('반복 유형')).toBeInTheDocument();
    expect(screen.getByLabelText('반복 간격')).toBeInTheDocument();
    expect(screen.getByLabelText('반복 종료일')).toBeInTheDocument();
  });

  // 매일 반복 설정 및 저장 테스트
  it('매일 반복 유형을 선택하고 저장하면 서버에 올바르게 전송되어야 한다', async () => {
    const mockEvents = setupMockHandlers();
    const { user } = setup();

    // 일정 로딩 완료 메시지 확인
    await screen.findByText('일정 로딩 완료!');

    // 일정 기본 정보 입력
    await user.type(screen.getByLabelText('제목'), '매일 스탠드업 미팅');
    await user.type(screen.getByLabelText('날짜'), '2024-05-20');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '09:30');
    await user.type(screen.getByLabelText('설명'), '매일 아침 스크럼 미팅');
    await user.type(screen.getByLabelText('위치'), '회의실 A');
    await user.selectOptions(screen.getByLabelText('카테고리'), '업무');

    // 반복 일정 체크박스 선택
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    await act(async () => {
      await user.click(repeatCheckbox);
    });

    // 반복 유형 선택 (매일)
    await user.selectOptions(screen.getByLabelText('반복 유형'), 'daily');

    // 반복 간격 설정
    const repeatIntervalInput = screen.getByLabelText('반복 간격');
    await user.clear(repeatIntervalInput);
    await user.type(repeatIntervalInput, '1');

    // 반복 종료일 설정
    await user.type(screen.getByLabelText('반복 종료일'), '2024-05-24');

    // 일정 저장 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // 저장 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    // 저장된 이벤트 객체 확인
    expect(mockEvents.length).toBeGreaterThan(0);
    expect(mockEvents[0].title).toBe('매일 스탠드업 미팅');
    expect(mockEvents[0].repeat.type).toBe('daily');
    expect(mockEvents[0].repeat.interval).toBe(1);
    expect(mockEvents[0].repeat.endDate).toBe('2024-05-24');
  });

  // 매주 반복 설정 및 저장 테스트
  it('매주 반복 유형을 선택하고 저장하면 서버에 올바르게 전송되어야 한다', async () => {
    const mockEvents = setupMockHandlers();
    const { user } = setup();

    // 일정 로딩 완료 메시지 확인
    await screen.findByText('일정 로딩 완료!');

    // 일정 기본 정보 입력
    await user.type(screen.getByLabelText('제목'), '주간 팀 미팅');
    await user.type(screen.getByLabelText('날짜'), '2024-05-20');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '15:00');
    await user.type(screen.getByLabelText('설명'), '주간 팀 미팅');
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
    await user.type(screen.getByLabelText('반복 종료일'), '2024-06-17');

    // 일정 저장 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // 저장 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    // 저장된 이벤트 객체 확인
    expect(mockEvents.length).toBeGreaterThan(0);
    expect(mockEvents[0].title).toBe('주간 팀 미팅');
    expect(mockEvents[0].repeat.type).toBe('weekly');
    expect(mockEvents[0].repeat.interval).toBe(1);
    expect(mockEvents[0].repeat.endDate).toBe('2024-06-17');
  });
});
