import { Event } from '../types';

export const useRecurrentEventDisplay = () => {
  const getRecurrentIcon = (event: Event) => {
    if (event.repeat.type !== 'none') {
      return '🔁';
    }
    return '';
  };

  const shouldDisplayRecurrentEvent = (event: Event, currentDate: string) => {
    // 반복 일정이 아니면 무조건 표시
    if (event.repeat.type === 'none') return true;

    // 종료일이 있고, 현재 날짜가 종료일을 넘었으면 표시하지 않음
    if (event.repeat.endDate && currentDate > event.repeat.endDate) {
      return false;
    }

    // 시작일보다 이전 날짜면 표시하지 않음
    if (currentDate < event.date) {
      return false;
    }

    // 반복 간격에 따른 표시 여부 계산
    const startDate = new Date(event.date);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    switch (event.repeat.type) {
      case 'daily':
        return diffDays % event.repeat.interval === 0;
      case 'weekly':
        return diffDays % (7 * event.repeat.interval) === 0;
      case 'monthly':
        const monthDiff =
          (current.getFullYear() - startDate.getFullYear()) * 12 +
          (current.getMonth() - startDate.getMonth());
        return monthDiff % event.repeat.interval === 0 && current.getDate() === startDate.getDate();
      case 'yearly':
        const yearDiff = current.getFullYear() - startDate.getFullYear();
        return (
          yearDiff % event.repeat.interval === 0 &&
          current.getMonth() === startDate.getMonth() &&
          current.getDate() === startDate.getDate()
        );
      default:
        return false;
    }
  };

  const getRecurrentText = (event: Event) => {
    if (event.repeat.type === 'none') return '';

    const intervalText = {
      daily: '일',
      weekly: '주',
      monthly: '월',
      yearly: '년',
    }[event.repeat.type];

    return `반복: ${event.repeat.interval}${intervalText}마다${
      event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
    }`;
  };

  return {
    getRecurrentIcon,
    shouldDisplayRecurrentEvent,
    getRecurrentText,
  };
};
