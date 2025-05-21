import { ChangeEvent, useEffect, useState } from 'react';

import { Event, RepeatInfo, RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

type TimeErrorRecord = Record<'startTimeError' | 'endTimeError', string | null>;

export const useEventForm = (initialEvent?: Event) => {
  const DEFAULT_MAX_OCCURRENCES = 10;
  const DEFAULT_END_DATE = '2025-09-30';

  const getInitialEndType = (event?: Event): 'date' | 'count' | 'never' => {
    if (!event || !event.repeat) return 'date';

    if (event.repeat.maxOccurrences) return 'count';
    if (event.repeat.endDate && event.repeat.type !== 'none') return 'date';
    return 'never';
  };

  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(initialEvent?.date || '');
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [category, setCategory] = useState(initialEvent?.category || '');
  const [isRepeating, setIsRepeating] = useState(
    initialEvent ? initialEvent.repeat.type !== 'none' : false
  );
  const [repeatType, setRepeatType] = useState<RepeatType>(initialEvent?.repeat.type || 'none');
  const [repeatInterval, setRepeatIntervalState] = useState(initialEvent?.repeat.interval || 1);
  // const [repeatEndDate, setRepeatEndDate] = useState(initialEvent?.repeat.endDate || '');
  const [notificationTime, setNotificationTime] = useState(initialEvent?.notificationTime || 10);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [repeatEndType, setRepeatEndTypeInternal] = useState<'date' | 'count' | 'never'>(
    getInitialEndType(initialEvent)
  );

  const [{ startTimeError, endTimeError }, setTimeError] = useState<TimeErrorRecord>({
    startTimeError: null,
    endTimeError: null,
  });

  const setRepeatInterval = (value: number) => {
    setRepeatIntervalState(value);
  };

  // 초기 maxOccurrences 값 결정 - 'count' 타입일 때만 의미 있음
  const initialMaxOccurrences =
    getInitialEndType(initialEvent) === 'count'
      ? initialEvent?.repeat.maxOccurrences || DEFAULT_MAX_OCCURRENCES
      : undefined;

  const [repeatMaxOccurrences, setRepeatMaxOccurrencesState] = useState<number | undefined>(
    initialMaxOccurrences
  );

  // 초기 endDate 값 결정 - 'date' 타입일 때만 의미 있음
  const initialEndDate =
    getInitialEndType(initialEvent) === 'date' ? initialEvent?.repeat.endDate || '' : '';

  const [repeatEndDate, setRepeatEndDateState] = useState(initialEndDate);

  // 종료 유형 변경 시 다른 종료 조건 초기화 및 활성화
  const setRepeatEndType = (type: 'date' | 'count' | 'never') => {
    setRepeatEndTypeInternal(type);

    if (type === 'date') {
      // 횟수 종료 초기화
      setRepeatMaxOccurrencesState(undefined);

      // 날짜가 없으면 빈 문자열로 유지
      if (!repeatEndDate) {
        setRepeatEndDateState('');
      }
    } else if (type === 'count') {
      // 날짜 종료 초기화
      setRepeatEndDateState('');

      // 횟수가 설정되지 않았으면 기본값 설정
      if (repeatMaxOccurrences === undefined) {
        setRepeatMaxOccurrencesState(DEFAULT_MAX_OCCURRENCES);
      }
    } else if (type === 'never') {
      // 둘 다 초기화 - 내부적으로는 endDate만 사용됨
      setRepeatEndDateState('');
      setRepeatMaxOccurrencesState(undefined);
    }
  };

  // UI 편의를 위한 래퍼 함수들 - 개선된 타입 안전성
  const setRepeatEndDate = (date: string) => {
    setRepeatEndDateState(date);

    // 만약 날짜를 입력했지만 date 타입이 아니라면 자동 변경
    if (date && repeatEndType !== 'date') {
      setRepeatEndType('date');
    }
  };

  // 개선된 setRepeatMaxOccurrences - 값 유효성 검사를 함수 내부로 이동
  const setRepeatMaxOccurrences = (value: number | string | undefined) => {
    // 숫자로 변환 (빈 문자열이나 NaN 처리)
    const numValue = value === undefined || value === '' ? undefined : Number(value);

    // 유효한 값인 경우만 설정 (1 이상 또는 undefined)
    if (numValue === undefined) {
      setRepeatMaxOccurrencesState(undefined);
    } else {
      const validValue =
        isNaN(numValue) || numValue < 1 ? DEFAULT_MAX_OCCURRENCES : Math.floor(numValue);
      setRepeatMaxOccurrencesState(validValue);
    }

    // 횟수를 명시적으로 입력했고 count 타입이 아니라면 자동 변경
    if (numValue && numValue >= 1 && repeatEndType !== 'count') {
      setRepeatEndType('count');
    }
  };

  // 반복 정보 생성 함수 - id는 제외
  const createRepeatInfo = (): Omit<RepeatInfo, 'id'> => {
    if (!isRepeating) {
      return { type: 'none', interval: 0 };
    }

    const baseInfo = {
      type: repeatType,
      interval: Number(repeatInterval),
    };

    switch (repeatEndType) {
      case 'date':
        return {
          ...baseInfo,
          endDate: repeatEndDate || DEFAULT_END_DATE, // 날짜가 비어있으면 기본값 사용
        };
      case 'count':
        return {
          ...baseInfo,
          maxOccurrences: repeatMaxOccurrences || DEFAULT_MAX_OCCURRENCES, // 횟수가 없으면 기본값 사용
          endDate: DEFAULT_END_DATE, // 안전장치로 기본 종료일 항상 포함
        };
      case 'never':
      default:
        return {
          ...baseInfo,
          endDate: DEFAULT_END_DATE, // 종료 없음은 기본 종료일 사용
        };
    }
  };

  useEffect(() => {
    if (isRepeating) {
      if (repeatType === 'none') setRepeatType('daily');
    } else {
      setRepeatType('none');
    }
  }, [isRepeating]);

  useEffect(() => {
    if (repeatType !== 'none' && !isRepeating) {
      setIsRepeating(true);
    }
  }, [repeatType]);

  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    setTimeError(getTimeErrorMessage(newStartTime, endTime));
  };

  const handleEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    setTimeError(getTimeErrorMessage(startTime, newEndTime));
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setDescription('');
    setLocation('');
    setCategory('');
    setIsRepeating(false);
    setRepeatType('none');
    setRepeatInterval(1);
    setRepeatEndDate('');
    setNotificationTime(10);
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDate(event.date);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setDescription(event.description);
    setLocation(event.location);
    setCategory(event.category);
    setIsRepeating(event.repeat.type !== 'none');
    setRepeatType(event.repeat.type);
    setRepeatIntervalState(event.repeat?.interval !== undefined ? event.repeat.interval : 1);
    setRepeatEndDate(event.repeat.endDate || '');
    setNotificationTime(event.notificationTime);
  };

  return {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    notificationTime,
    setNotificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    handleStartTimeChange,
    handleEndTimeChange,
    resetForm,
    editEvent,
  };
};
