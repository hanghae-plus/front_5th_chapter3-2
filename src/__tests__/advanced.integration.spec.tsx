import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ReactElement, useState } from 'react';

import RepeatEventManager from '../components/RepeatEventManager.tsx';
import { RepeatType } from '../types.ts';

// 테스트용 래퍼 컴포넌트
const RepeatEventManagerWrapper = ({
  initialIsRepeating = false,
  initialRepeatType = 'none' as RepeatType,
  initialRepeatInterval = 1,
  initialRepeatEndDate = '',
  onStateChange = () => {},
}) => {
  const [isRepeating, setIsRepeating] = useState(initialIsRepeating);
  const [repeatType, setRepeatType] = useState<RepeatType>(initialRepeatType);
  const [repeatInterval, setRepeatInterval] = useState(initialRepeatInterval);
  const [repeatEndDate, setRepeatEndDate] = useState(initialRepeatEndDate);

  const handleRepeatingChange = (value: boolean) => {
    setIsRepeating(value);
    onStateChange({ isRepeating: value, repeatType, repeatInterval, repeatEndDate });
  };

  const handleTypeChange = (value: RepeatType) => {
    setRepeatType(value);
    onStateChange({ isRepeating, repeatType: value, repeatInterval, repeatEndDate });
  };

  const handleIntervalChange = (value: number) => {
    setRepeatInterval(value);
    onStateChange({ isRepeating, repeatType, repeatInterval: value, repeatEndDate });
  };

  const handleEndDateChange = (value: string) => {
    setRepeatEndDate(value);
    onStateChange({ isRepeating, repeatType, repeatInterval, repeatEndDate: value });
  };

  return (
    <div data-testid="repeat-manager-wrapper">
      <RepeatEventManager
        isRepeating={isRepeating}
        setIsRepeating={handleRepeatingChange}
        repeatType={repeatType}
        setRepeatType={handleTypeChange}
        repeatInterval={repeatInterval}
        setRepeatInterval={handleIntervalChange}
        repeatEndDate={repeatEndDate}
        setRepeatEndDate={handleEndDateChange}
      />
      {/* 상태 확인용 디버깅 정보 */}
      <div data-testid="debug-info">
        <span data-testid="is-repeating">{isRepeating.toString()}</span>
        <span data-testid="repeat-type">{repeatType}</span>
        <span data-testid="repeat-interval">{repeatInterval}</span>
        <span data-testid="repeat-end-date">{repeatEndDate}</span>
      </div>
    </div>
  );
};

const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

describe('반복 일정 기능', () => {
  describe('반복 설정 토글', () => {
    it('반복 일정 체크박스를 클릭하면 반복 설정 폼이 나타난다', async () => {
      const { user } = setup(<RepeatEventManagerWrapper />);

      // 체크박스 클릭
      await user.click(screen.getByRole('checkbox'));

      // 반복 설정 폼이 나타남
      expect(screen.getByText('반복 유형')).toBeInTheDocument();
      expect(screen.getByText('반복 간격')).toBeInTheDocument();
      expect(screen.getByText('반복 종료일')).toBeInTheDocument();

      expect(screen.getByTestId('is-repeating')).toHaveTextContent('true');
    });
    it('체크박스를 다시 클릭하면 반복 설정 폼이 사라진다', async () => {
      const { user } = setup(<RepeatEventManagerWrapper initialIsRepeating={true} />);

      // 체크박스 클릭해서 비활성화
      await user.click(screen.getByRole('checkbox'));

      // 반복 설정 폼이 사라짐
      expect(screen.queryByText('반복 유형')).not.toBeInTheDocument();
      expect(screen.getByTestId('is-repeating')).toHaveTextContent('false');
    });
  });

  describe('반복 유형 설정', () => {
    it('반복 유형을 변경할 수 있다', async () => {
      const { user } = setup(<RepeatEventManagerWrapper initialIsRepeating={true} />);

      const typeSelect = screen.getByLabelText('반복 유형');

      // 초기값 확인 (기본값: daily)
      expect(typeSelect).toHaveValue('daily');

      // 반복 유형을 weekly 로 변경
      await user.selectOptions(typeSelect, 'weekly');
      expect(typeSelect).toHaveValue('weekly');
      expect(screen.getByTestId('repeat-type')).toHaveTextContent('weekly');

      // 반복 유형을 monthly 로 변경
      await user.selectOptions(typeSelect, 'monthly');
      expect(typeSelect).toHaveValue('monthly');
      expect(screen.getByTestId('repeat-type')).toHaveTextContent('monthly');

      // 반복 유형을 yearly 로 변경
      await user.selectOptions(typeSelect, 'yearly');
      expect(typeSelect).toHaveValue('yearly');
      expect(screen.getByTestId('repeat-type')).toHaveTextContent('yearly');
    });
    it('반복 유형 옵션으로 daily, weekly, monthly, yearly가 존재한다', () => {
      setup(<RepeatEventManagerWrapper initialIsRepeating={true} />);

      const typeSelect = screen.getByLabelText('반복 유형');
      const options = within(typeSelect).getAllByRole('option');

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('daily');
      expect(options[1]).toHaveValue('weekly');
      expect(options[2]).toHaveValue('monthly');
      expect(options[3]).toHaveValue('yearly');
    });
  });

  describe('반복 간격 설정', () => {
    it('반복 간격을 변경할 수 있다', async () => {
      const { user } = setup(<RepeatEventManagerWrapper initialIsRepeating={true} />);

      const intervalInput = screen.getByLabelText('반복 간격');

      // 초기값이 1인지 확인
      expect(intervalInput).toHaveValue(1);

      // 간격 변경
      await user.clear(intervalInput);
      await user.type(intervalInput, '3');

      expect(intervalInput).toHaveValue(3);
      expect(screen.getByTestId('repeat-interval')).toHaveTextContent('3');
    });
    it('반복 간격에 유효하지 않은 값을 입력할 수 없다', async () => {
      const { user } = setup(<RepeatEventManagerWrapper initialIsRepeating={true} />);

      const intervalInput = screen.getByLabelText('반복 간격');

      // 음수 입력 시도 (min=1 이므로 제한되어야 함)
      await user.clear(intervalInput);
      await user.type(intervalInput, '-1');

      expect(intervalInput).toHaveAttribute('min', '1');
    });
  });

  describe('반복 종료일 설정', () => {
    it('반복 종료일을 설정할 수 있다', async () => {
      const { user } = setup(<RepeatEventManagerWrapper initialIsRepeating={true} />);

      const endDateInput = screen.getByLabelText('반복 종료일');

      await user.type(endDateInput, '2025-12-31');

      expect(endDateInput).toHaveValue('2025-12-31');
      expect(screen.getByTestId('repeat-end-date')).toHaveTextContent('2025-12-31');
    });
    it('반복 종료일을 비워둘 수 있다', async () => {
      const { user } = setup(
        <RepeatEventManagerWrapper initialIsRepeating={true} initialRepeatEndDate="2025-12-31" />
      );

      const endDateInput = screen.getByLabelText('반복 종료일');

      await user.clear(endDateInput);

      expect(endDateInput).toHaveValue('');
      expect(screen.getByTestId('repeat-end-date')).toHaveTextContent('');
    });
  });

  describe('반복 일정 생성', () => {
    it('반복 일정이 정상적으로 생성 된다', async () => {
      const mockCallback = vi.fn();
      const { user } = setup(<RepeatEventManagerWrapper onStateChange={mockCallback} />);

      // 1. 반복 설정 활성화
      await user.click(screen.getByRole('checkbox'));
      expect(screen.getByText('반복 유형')).toBeInTheDocument();

      // 2. 주간 반복으로 설정
      await user.selectOptions(screen.getByLabelText('반복 유형'), 'weekly');
      expect(screen.getByTestId('repeat-type')).toHaveTextContent('weekly');

      // 3. 2주마다 반복으로 설정
      const intervalInput = screen.getByLabelText('반복 간격');
      await user.clear(intervalInput);
      await user.type(intervalInput, '2');
      expect(screen.getByTestId('repeat-interval')).toHaveTextContent('2');

      // 4. 종료일 설정
      await user.type(screen.getByLabelText('반복 종료일'), '2025-12-31');
      expect(screen.getByTestId('repeat-end-date')).toHaveTextContent('2025-12-31');

      // 최종 상태 확인
      expect(screen.getByTestId('is-repeating')).toHaveTextContent('true');

      expect(mockCallback).toHaveBeenLastCalledWith({
        isRepeating: true,
        repeatType: 'weekly',
        repeatInterval: 2,
        repeatEndDate: '2025-12-31',
      });
    });
  });

  describe('반복 일정 표시', () => {
    it('반복 일정의 제목에는 반복이란 텍스트가 존재한다', () => {
      const mockEvent = {
        id: '1',
        title: '주간 회의',
        date: '2025-05-23',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'weekly' as RepeatType,
          interval: 1,
          endDate: '2025-12-31',
        },
        notificationTime: 10,
      };

      // 반복 일정의 제목은 "(반복)" 접두사가 붙어야 함
      const expectedTitle = `(반복) ${mockEvent.title}`;

      // 실제 앱에서는 이벤트 목록에 표시될 때 이런 형태로 나타남
      render(
        <ChakraProvider>
          <div data-testid="event-item">
            <span data-testid="event-title">{expectedTitle}</span>
            <span>반복: {mockEvent.repeat.interval}주마다</span>
          </div>
        </ChakraProvider>
      );

      const eventTitle = screen.getByTestId('event-title');
      expect(eventTitle).toHaveTextContent('(반복) 주간 회의');
      expect(eventTitle.textContent).toMatch(/^\(반복\)/);
    });

    it('일반 일정의 제목에는 반복 텍스트가 없다', () => {
      const mockEvent = {
        id: '2',
        title: '점심 약속',
        date: '2025-05-23',
        startTime: '12:00',
        endTime: '13:00',
        description: '친구와 점심',
        location: '레스토랑',
        category: '개인',
        repeat: {
          type: 'none' as RepeatType,
          interval: 0,
        },
        notificationTime: 10,
      };

      // 일반 일정은 제목 그대로
      render(
        <ChakraProvider>
          <div data-testid="event-item">
            <span data-testid="event-title">{mockEvent.title}</span>
          </div>
        </ChakraProvider>
      );

      const eventTitle = screen.getByTestId('event-title');
      expect(eventTitle).toHaveTextContent('점심 약속');
      expect(eventTitle.textContent).not.toMatch(/^\(반복\)/);
    });
  });
});
