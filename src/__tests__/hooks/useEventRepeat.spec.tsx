import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import { setupMockHandlerCreation, setupMockHandlerRepeat } from '../../__mocks__/handlersUtils';
import App from '../../App';
import { server } from '../../setupTests';
import { Event } from '../../types';

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

const saveRepeatSchedule = async (
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
  await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
  await user.type(screen.getByLabelText('반복 간격'), repeat.interval.toString());

  await user.click(screen.getByTestId('event-submit-button'));
};

/* 
1. **반복 유형 선택**
    - 일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.
    - 반복 유형은 다음과 같다: 매일, 매주, 매월, 매년
        - 만약, 윤년 29일에 또는 31일에 매월 또는 매년 반복일정을 설정한다면 어떻게 처리할까요? 다른 서비스를 참고해보시고 자유롭게 작성해보세요.
*/

// CRUD 단위로 테스트? 따로따로 예외처리
/**@description 반복 유형 선택 : 일정 생성 또는 수정 시 반복 유형을 선택한다.*/
describe('반복 일정 생성 : 유형별 반복 일정을 생성 또는 수정한다', () => {
  test('2025년 5월 19일 월요일부터 매일 반복 일정을 생성한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveRepeatSchedule(user, {
      title: '반복 일정 생성 테스트',
      date: '2025-05-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
      },
    });
  });

  test('2025년 5월 19일 월요일부터 매주 반복 일정을 생성한다', () => {});

  test('2025년 5월 19일 월요일부터 매달 반복 일정을 생성한다', () => {});

  test('2025년 5월 19일 월요일부터 매년 반복 일정을 생성한다', () => {});

  test('2025년 5월 19일 월요일부터 주중 매일(월-금) 반복 일정을 생성한다', () => {});

  test('2024년 2월 29일 목요일에 매월 반복 일정을 생성한다면 다음달 마지막주 목요일마다 반복 일정이 생성된다', () => {});

  test('2024년 2월 29일 목요일에 매년 반복 일정을 생성한다면 돌아오는 윤년마다 반복 일정이 생성된다', () => {});

  test('2024년 2월 29일 목요일에 3년에 한번씩 반복 일정을 생성한다면 12년에 한번씩 반복 일정이 생성된다', () => {});
});

/*2. **반복 간격 설정**
    - 각 반복 유형에 대해 간격을 설정할 수 있다.
    - 예: 2일마다, 3주마다, 2개월마다 등
*/

/**@description 반복 간격 설정 */
describe('반복 간격 설정: 반복 간격 입력시 간격에 맞는 반복 일정을 생성할 수 있다', () => {
  test('2일마다 반복 일정을 생성한다', () => {});
  test('3주마다 반복 일정을 생성한다', () => {});
  test('2개월마다 반복 일정을 생성한다', () => {});
});

/**
 * 
3.  **반복 일정 표시**
    - 캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다.
        - 아이콘을 넣든 태그를 넣든 자유롭게 해보세요!
*/

/**@description 반복 일정 표시 */
describe('반복 일정 표시: 캘린더 뷰에서 반복 일정을 시각적으로 구분하여 표시한다', () => {
  test('반복 일정일 경우 파란색으로 시각적으로 구분하여 표시한다', () => {});
});

/*
4. **(필수) 반복 종료**
    - 반복 종료 조건을 지정할 수 있다.
    - 옵션: 특정 날짜까지, 특정 횟수만큼, 또는 종료 없음 (예제 특성상, 2025-09-30까지)

*/

/**@description 반복 종료 */
describe('반복 종료: 반복 종료 조건을 지정할 수 있다', () => {
  test('반복 종료 조건을 지정할 수 있다', () => {});
});

/* 5. **(필수) 반복 일정 단일 수정**
    - 반복일정을 수정하면 단일 일정으로 변경됩니다.
    - 반복일정 아이콘도 사라집니다.

*/

/**@description 반복 일정 단일 수정 */
describe('반복 일정 단일 수정: 반복일정을 수정하면 단일 일정으로 변경된다', () => {
  test('반복일정을 수정하면 단일 일정으로 변경된다', () => {});
});

/* 6. **(필수)**  **반복 일정 단일 삭제**
    - 반복일정을 삭제하면 해당 일정만 삭제합니다.
 */

/**@description 반복 일정 단일 삭제 */
describe('반복 일정 단일 삭제: 반복일정을 삭제하면 해당 일정만 삭제한다', () => {
  test('반복일정 중 하나를 삭제하면 해당 일정만 삭제한다', () => {});
});

/**
 * 
 * import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEventRepeat } from '../hooks/useEventRepeat';
import { Event, RepeatInfo } from '../types';

describe('useEventRepeat 훅 테스트', () => {
  let mockInitialEvent: Event;

  beforeEach(() => {
    mockInitialEvent = {
      id: 'event_1',
      title: '테스트 일정',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endType: 'count',
        endCount: 1,
      },
      notificationTime: 30,
    };
  });

  test('반복 일정을 생성한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 3,
    };
//
    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-02');
    expect(result.current.events[2].date).toBe('2025-10-03');
  });

  test('반복 일정을 수정한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.updateRepeatEvent('event_1_1', { title: '수정된 일정' });
    });

    expect(result.current.events[1].title).toBe('수정된 일정');
    expect(result.current.events[0].title).toBe('테스트 일정');
  });

  test('반복 일정을 삭제한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.deleteRepeatEvent('event_1_1');
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('event_1');
  });

  test('모든 반복 일정을 수정한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.updateAllRepeatEvents({ title: '전체 수정된 일정' });
    });

    expect(result.current.events[0].title).toBe('전체 수정된 일정');
    expect(result.current.events[1].title).toBe('전체 수정된 일정');
  });

  test('모든 반복 일정을 삭제한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.deleteAllRepeatEvents();
    });

    expect(result.current.events).toHaveLength(0);
  });

  test('주간 반복에서 특정 요일만 선택한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'weekly',
      interval: 1,
      endType: 'count',
      endCount: 2,
      daysOfWeek: [3], // 수요일 (2025-10-01은 수요일)
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-08');
  });

  test('반복 일정 생성 시 콜백이 호출된다', async () => {
    const onRepeatChange = vi.fn();
    const { result } = renderHook(() =>
      useEventRepeat({
        initialEvent: mockInitialEvent,
        onRepeatChange,
      })
    );

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    expect(onRepeatChange).toHaveBeenCalledWith(result.current.events);
  });
});

 */
