import { useState } from 'react';
import { RepeatType } from '../types';

export const useRecurringEvents = () => {
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [repeatEndDate, setRepeatEndDate] = useState<string>('2025-09-30');

  const changeRepeatType = (type: RepeatType) => {
    setRepeatType(type);
  };

  const changeRepeatInterval = (interval: number) => {
    if (interval <= 0) {
      throw new Error('반복 간격은 1 이상이어야 합니다.');
    }
    setRepeatInterval(interval);
  };

  const changeRepeatEndDate = (date: string) => {
    setRepeatEndDate(date);
  };

  return {
    repeatType,
    repeatInterval,
    repeatEndDate,
    changeRepeatType,
    changeRepeatInterval,
    changeRepeatEndDate,
  };
}; 