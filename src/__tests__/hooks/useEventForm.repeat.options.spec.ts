// src/__tests__/hooks/useEventForm.repeat.options.spec.ts
import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { Event, RepeatInfo } from '../../types';

const DEFAULT_REPEAT_END_DATE_FOR_NO_END = '2025-09-30';

describe('useEventForm - 반복 종료 옵션 관리', () => {
  it('초기 상태에서는 repeatEndDate와 repeatCount가 모두 비어 있어야 한다', () => { });

  // 특정 날짜까지
  it('setRepeatEndDate 호출 시 repeatEndDate가 설정되고 repeatCount는 undefined로 초기화되어야 한다', () => { });

  // 특정 횟수만큼
  it('setRepeatCount 호출 시 repeatCount가 설정되고 repeatEndDate는 빈 문자열로 초기화되어야 한다', () => { });

  it('setRepeatCount에 0 또는 음수 입력 시 1로 보정되어야 한다', () => { });

  // 편집 시나리오
  it('endDate가 있는 이벤트 편집 시 repeatEndDate가 설정되고 repeatCount는 undefined여야 한다', () => { });

  it('count가 있는 이벤트 편집 시 repeatCount가 설정되고 repeatEndDate는 빈 문자열이어야 한다', () => { });

  it('endDate와 count가 모두 있는 이벤트 편집 시 (정책: endDate 우선), repeatEndDate가 설정되고 count는 무시(undefined)된다', () => { });

  // 폼 리셋
  it('resetForm 호출 시 repeatEndDate와 repeatCount가 모두 초기화되어야 한다', () => { });
});
