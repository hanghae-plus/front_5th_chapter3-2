import { useState } from 'react';

import { Event, EventForm } from '@/types';

export const useInvalidMonthlyRepeatModal = () => {
  const [isInvalidMonthlyRepeatModalOpen, setIsInvalidMonthlyRepeatModalOpen] = useState(false);

  const isInvalidMonthlyRepeat = (eventFormData: Event | EventForm) => {
    if (eventFormData.repeat?.type !== 'monthly') return false;
    const date = eventFormData.date;
    if (!date) return false;
    const [, , day] = date.split('-');
    return day === '31';
  };

  return {
    isInvalidMonthlyRepeatModalOpen,
    setIsInvalidMonthlyRepeatModalOpen,
    isInvalidMonthlyRepeat,
  };
};
