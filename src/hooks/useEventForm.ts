import { ChangeEvent, useState } from 'react';

import { Event, RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

type TimeErrorRecord = Record<'startTimeError' | 'endTimeError', string | null>;

export const useEventForm = (initialEvent?: Event) => {
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(initialEvent?.date || '');
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [category, setCategory] = useState(initialEvent?.category || '');
  const [isRepeating, setIsRepeating] = useState(initialEvent?.repeat?.type !== 'none');
  const [repeatType, setRepeatType] = useState<RepeatType>(initialEvent?.repeat?.type || 'daily');
  const [repeatInterval, setRepeatInterval] = useState(initialEvent?.repeat?.interval || 1);
  const [repeatEndDate, setRepeatEndDate] = useState(initialEvent?.repeat?.endDate || '');
  const [notificationTime, setNotificationTime] = useState(initialEvent?.notificationTime || 10);

  // repeatEndOption 상태 추가
  const [repeatEndOption, setRepeatEndOption] = useState<'untilDate' | 'count' | 'none'>(
    initialEvent?.repeat?.endDate // endDate가 있으면 'untilDate'
      ? 'untilDate'
      : initialEvent?.repeat?.count // count가 있으면 'count'
        ? 'count'
        : 'none' // 둘 다 없으면 'none'
  );

  // repeatCount 상태 추가
  const [repeatCount, setRepeatCount] = useState(initialEvent?.repeat?.count || 1);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [{ startTimeError, endTimeError }, setTimeError] = useState<TimeErrorRecord>({
    startTimeError: null,
    endTimeError: null,
  });

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
    setRepeatType('daily');
    setRepeatInterval(1);
    setRepeatEndDate('');
    setNotificationTime(10);
    setRepeatEndOption('none'); // 폼 초기화 시 반복 종료 옵션도 초기화
    setRepeatCount(1); // 폼 초기화 시 반복 횟수도 초기화
    setEditingEvent(null); // 리셋 시 editingEvent도 null로 설정
    setTimeError({ startTimeError: null, endTimeError: null });
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
    setRepeatInterval(event.repeat.interval);
    setRepeatEndDate(event.repeat.endDate || '');
    setNotificationTime(event.notificationTime);

    const eventRepeat = event.repeat;
    if (eventRepeat && eventRepeat.type !== 'none') {
      setIsRepeating(true);
      setRepeatType(eventRepeat.type);
      setRepeatInterval(eventRepeat.interval);

      if (eventRepeat.endDate) {
        setRepeatEndOption('untilDate');
        setRepeatEndDate(eventRepeat.endDate);
        setRepeatCount(1); // endDate가 있으면 count는 1로 초기화 (중복 방지)
      } else if (eventRepeat.count) {
        setRepeatEndOption('count');
        setRepeatCount(eventRepeat.count);
        setRepeatEndDate(''); // count가 있으면 endDate는 빈 문자열로 초기화 (중복 방지)
      } else {
        // type이 'none'은 아니지만 endDate/count가 없는 경우 (예: '종료 없음'으로 저장된 반복)
        setRepeatEndOption('none');
        setRepeatEndDate('');
        setRepeatCount(1);
      }
    } else {
      // 단일 이벤트인 경우
      setIsRepeating(false);
      setRepeatType('daily'); // 기본값으로 설정
      setRepeatInterval(1); // 기본값으로 설정
      setRepeatEndDate('');
      setRepeatEndOption('none');
      setRepeatCount(1);
    }
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
    repeatEndOption, // 반환 값에 추가
    setRepeatEndOption, // 반환 값에 추가
    repeatCount, // 반환 값에 추가
    setRepeatCount, // 반환 값에 추가
  };
};
