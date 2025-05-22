import { useState } from 'react';

import { RepeatType } from '../types';

export const useRepeatSettings = (initialEvent?: {
  repeat: { type: RepeatType; interval?: number; endDate?: string };
}) => {
  const [isRepeating, setIsRepeating] = useState(initialEvent?.repeat.type !== 'none');
  const [repeatType, setRepeatType] = useState<RepeatType>(initialEvent?.repeat.type || 'none');
  const [repeatInterval, setRepeatInterval] = useState(initialEvent?.repeat.interval || 1);
  const [repeatEndDate, setRepeatEndDate] = useState(initialEvent?.repeat.endDate || '');

  const resetRepeat = () => {
    setIsRepeating(false);
    setRepeatType('none');
    setRepeatInterval(1);
    setRepeatEndDate('');
  };

  const editRepeat = (repeat: { type: RepeatType; interval?: number; endDate?: string }) => {
    setIsRepeating(repeat.type !== 'none');
    setRepeatType(repeat.type);
    setRepeatInterval(repeat.interval || 1);
    setRepeatEndDate(repeat.endDate || '');
  };

  return {
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    resetRepeat,
    editRepeat,
  };
};
