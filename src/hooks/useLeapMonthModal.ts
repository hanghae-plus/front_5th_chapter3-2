import { useState } from 'react';

import { Event, EventForm } from '@/types';

export const useLeapMonthModal = () => {
  const [isLeapMonthModalOpen, setIsLeapMonthModalOpen] = useState(false);

  const isLeapDayYearlyRepeat = (eventFormData: Event | EventForm) => {
    // * repeat.type이 yearly가 아닐 경우 false
    if (eventFormData.repeat?.type !== 'yearly') return false;
    const date = eventFormData.date;
    if (!date) return false;
    const [, month, day] = date.split('-');
    // * 2월 29일이면 true
    return month === '02' && day === '29';
  };

  return {
    isLeapMonthModalOpen,
    isLeapDayYearlyRepeat,
    setIsLeapMonthModalOpen,
  };
};
