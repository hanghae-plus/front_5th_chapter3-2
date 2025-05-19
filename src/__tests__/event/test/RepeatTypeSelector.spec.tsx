// 반복 유형 선택

import { FormLabel } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import ScheduleEventForm from '@/entities/eventForm/ui/ScheduleEventForm';
import { RepeatType } from '@/types';

/**
 * 1. **(필수) 반복 유형 선택**
    - 일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.
    - 반복 유형은 다음과 같다: 매일, 매주, 매월, 매년
	  - 만약, 윤년 29일에 또는 31일에 매월 또는 매년 반복일정을 설정한다면 어떻게 처리할까요? 다른 서비스를 참고해보시고 자유롭게 작성해보세요.
 */

describe('ScheduleEventForm - 반복 유형 선택', () => {
  const defaultFormState = {
    title: '',
    setTitle: () => {},
    date: '2025-07-01',
    setDate: () => {},
    startTime: '',
    setStartTime: () => {},
    endTime: '',
    setEndTime: () => {},
    handleStartTimeChange: () => {},
    handleEndTimeChange: () => {},
    startTimeError: null,
    endTimeError: null,
    description: '',
    setDescription: () => {},
    location: '',
    setLocation: () => {},
    category: '',
    setCategory: () => {},
    isRepeating: true, // ⬅️ 반복 옵션이 켜져 있어야 렌더링됨
    setIsRepeating: () => {},
    repeatType: 'daily' as RepeatType,
    setRepeatType: () => {},
    repeatInterval: 1,
    setRepeatInterval: () => {},
    repeatEndDate: '',
    setRepeatEndDate: () => {},
    notificationTime: 10,
    setNotificationTime: () => {},
    editingEvent: null,
  };

  const notificationOptions = [
    { value: 0, label: '알림 없음' },
    { value: 10, label: '10분 전' },
  ];

  it('일정 생성 폼에 반복 유형 선택 필드가 렌더링된다', async () => {
    render(
      <ChakraProvider>
        <ScheduleEventForm
          formState={defaultFormState}
          onSubmit={() => {}}
          notificationOptions={notificationOptions}
        />
      </ChakraProvider>
    );

    // ✅ 1차: 텍스트 기반 접근
    expect(screen.getByText('반복 일정')).toBeInTheDocument();

    // ✅ 2차: test ID 기반 접근
    const checkbox = await screen.findByTestId('repeat-checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('사용자가 반복 유형으로 "매일"을 선택할 수 있다', async () => {
    render(<FormLabel>반복 유형</FormLabel>);
    const select = screen.getByLabelText('반복');
    await userEvent.selectOptions(select, 'daily');
    expect(select).toHaveValue('daily');
  });

  it('2월 29일에 매월 반복을 설정하면, 윤년이 아닌 해는 2월 28일로 대체된다', () => {
    const events = generateRepeatEvents({
      title: '특수일정',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      repeat: {
        type: 'monthly',
        interval: 1,
        count: 3,
      },
    });

    expect(events.map((e) => e.date)).toEqual([
      '2024-02-29',
      '2024-03-29', // 실제 월 말일 고려하여 구현 필요
      '2024-04-29',
    ]);
  });
});

/**
 * 2. **(필수) 반복 간격 설정**
    - 각 반복 유형에 대해 간격을 설정할 수 있다.
    - 예: 2일마다, 3주마다, 2개월마다 등
 */
it('사용자가 반복 간격을 2로 설정하면 2일마다, 2주마다 등의 간격으로 적용된다', () => {
  // generateRepeatEvents 결과가 2 간격인지 확인
});
/**
 * 3. **(필수) 반복 일정 표시**
    - 캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다.
    - 아이콘을 넣든 태그를 넣든 자유롭게 해보세요!
 */
it('반복 일정인 경우 캘린더에 반복 아이콘(🔁 등)이 표시된다', () => {
  // calendar cell 내에 반복 아이콘 존재 여부 확인
});
/**
 * 4. **(필수) 반복 종료**
    - 반복 종료 조건을 지정할 수 있다.
    - 옵션: 특정 날짜까지, 특정 횟수만큼, 또는 종료 없음 (예제 특성상, 2025-09-30까지)
 */
it('반복 횟수(count)를 3으로 설정하면 3개의 일정만 생성된다', () => {
  // count 기준으로 반복 생성 결과 검증
});

it('반복 종료일(endDate) 이전까지만 일정이 생성된다', () => {
  // 2025-09-30 이전까지만 반복됨
});

/**
 * 5. **(필수) 반복 일정 단일 수정**
    - 반복일정을 수정하면 단일 일정으로 변경됩니다.
    - 반복일정 아이콘도 사라집니다.
 */
it('반복 일정 중 하나를 수정하면 해당 일정은 repeat.id가 제거되어 반복에서 분리된다', () => {
  // 수정 후 repeat.id가 사라졌는지 확인
});

/**
 * 6. **(필수)**  **반복 일정 단일 삭제**
    - 반복일정을 삭제하면 해당 일정만 삭제합니다.
 */
it('반복 일정 중 하나만 삭제하면 다른 일정은 유지된다', () => {
  // 삭제 요청 후 나머지 일정이 유지되는지 검증
});
