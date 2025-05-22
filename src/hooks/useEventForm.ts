import { ChangeEvent, useEffect, useState } from 'react';

import { Event, RepeatInfo, RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

type TimeErrorRecord = Record<'startTimeError' | 'endTimeError', string | null>;

// 상수 정의
const DEFAULT_REPEAT_END_DATE_FOR_NO_END = '2025-09-30';
const DEFAULT_MAX_OCCURRENCES = 10;

export type RepeatEndType = 'date' | 'count' | 'never';

export const useEventForm = (initialEvent?: Event) => {
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(initialEvent?.date || '');
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [category, setCategory] = useState(initialEvent?.category || '');

  const [notificationTime, setNotificationTime] = useState(initialEvent?.notificationTime || 10);

  // === 반복 관련 상태들 ===
  const [isRepeating, setIsRepeating] = useState(
    initialEvent ? isValidRepeatingEvent(initialEvent) : false
  );
  const [repeatType, setRepeatType] = useState<RepeatType>(
    initialEvent && isValidRepeatingEvent(initialEvent) ? initialEvent.repeat.type : 'none'
  );
  const [repeatInterval, setRepeatIntervalState] = useState(initialEvent?.repeat.interval || 1);
  const [repeatEndDate, setRepeatEndDate] = useState(initialEvent?.repeat.endDate || '');
  const [repeatEndType, setRepeatEndType] = useState<RepeatEndType>(() => {
    if (initialEvent && isValidRepeatingEvent(initialEvent)) {
      if (initialEvent.repeat.maxOccurrences) return 'count';
      if (!initialEvent.repeat.endDate) return 'never';
    }
    return 'date';
  });
  const [repeatMaxOccurrences, setRepeatMaxOccurrencesState] = useState<number | undefined>(
    initialEvent?.repeat.maxOccurrences
  );

  // === 편집 관련 상태들 ===
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // === 시간 검증 상태 ===
  const [{ startTimeError, endTimeError }, setTimeError] = useState<TimeErrorRecord>({
    startTimeError: null,
    endTimeError: null,
  });

  // === 유효성 검사 함수들 ===
  function isValidRepeatingEvent(event: Event): boolean {
    if (!event.repeat) return false;
    if (!event.repeat.type || event.repeat.type === 'none') return false;
    if (typeof event.repeat.type !== 'string') return false;
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(event.repeat.type)) return false;
    return true;
  }

  function isEditingRepeatingEvent(): boolean {
    const eventToCheck = editingEvent || initialEvent;
    return eventToCheck ? isValidRepeatingEvent(eventToCheck) : false;
  }

  // 안전하게 repeatMaxOccurrences를 설정하는 함수
  const setRepeatMaxOccurrences = (value: number | string | undefined) => {
    if (value === undefined || value === '') {
      setRepeatMaxOccurrencesState(undefined);
      return;
    }

    const numValue = typeof value === 'string' ? Number(value) : value;

    if (isNaN(numValue) || numValue <= 0) {
      setRepeatMaxOccurrencesState(DEFAULT_MAX_OCCURRENCES);
    } else {
      setRepeatMaxOccurrencesState(Math.floor(numValue));
    }
  };

  const setRepeatInterval = (value: number) => {
    setRepeatIntervalState(value);
  };

  // RepeatInfo 객체 생성 함수
  const createRepeatInfo = (): RepeatInfo => {
    if (isEditingRepeatingEvent()) {
      return {
        type: 'none',
        interval: 1,
      };
    }

    if (!isRepeating || repeatType === 'none') {
      return {
        type: 'none',
        interval: 1,
      };
    }

    const baseRepeatInfo: RepeatInfo = {
      type: repeatType,
      interval: repeatInterval,
    };

    if (repeatEndType === 'date') {
      return {
        ...baseRepeatInfo,
        endDate: repeatEndDate || DEFAULT_REPEAT_END_DATE_FOR_NO_END,
      };
    } else if (repeatEndType === 'count') {
      return {
        ...baseRepeatInfo,
        maxOccurrences: repeatMaxOccurrences ?? DEFAULT_MAX_OCCURRENCES,
        endDate: DEFAULT_REPEAT_END_DATE_FOR_NO_END, // 안전장치로 기본 종료일도 함께 저장
      };
    } else {
      // 'never'
      return {
        ...baseRepeatInfo,
        endDate: DEFAULT_REPEAT_END_DATE_FOR_NO_END, // 종료없음이지만 안전장치로 기본 종료일 설정
      };
    }
  };

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
    setRepeatEndType('date');
    setRepeatMaxOccurrences(undefined);
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
    setNotificationTime(event.notificationTime);

    // 반복 설정은 유효성 검사 후 설정
    if (isValidRepeatingEvent(event)) {
      setIsRepeating(true);
      setRepeatType(event.repeat.type);
      setRepeatIntervalState(event.repeat.interval || 1);

      // 종료 조건 설정
      if (event.repeat.maxOccurrences) {
        setRepeatEndType('count');
        setRepeatMaxOccurrences(event.repeat.maxOccurrences);
        setRepeatEndDate('');
      } else if (event.repeat.endDate) {
        setRepeatEndType('date');
        setRepeatEndDate(event.repeat.endDate);
        setRepeatMaxOccurrences(undefined);
      } else {
        setRepeatEndType('never');
        setRepeatEndDate('');
        setRepeatMaxOccurrences(undefined);
      }
    } else {
      setIsRepeating(false);
      setRepeatType('none');
      setRepeatEndType('date');
    }
  };

  // 종료 유형이 변경될 때 관련 상태 초기화
  useEffect(() => {
    if (repeatEndType === 'date') {
      setRepeatMaxOccurrences(undefined);
    } else if (repeatEndType === 'count') {
      setRepeatEndDate('');
      if (!repeatMaxOccurrences) {
        setRepeatMaxOccurrences(DEFAULT_MAX_OCCURRENCES);
      }
    } else if (repeatEndType === 'never') {
      setRepeatEndDate('');
      setRepeatMaxOccurrences(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatEndType]);

  useEffect(() => {
    if (isRepeating) {
      if (repeatType === 'none') setRepeatType('daily');
    } else {
      setRepeatType('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRepeating]);

  useEffect(() => {
    if (repeatType !== 'none' && !isRepeating) {
      setIsRepeating(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatType]);

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
    repeatEndType,
    setRepeatEndType,
    repeatMaxOccurrences,
    setRepeatMaxOccurrences,
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
    createRepeatInfo,
    isEditingRepeatingEvent,
  };
};
