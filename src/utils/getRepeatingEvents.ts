import { Event, EventForm } from '../types';
import { formatDate, getDaysInMonth } from './dateUtils';
//TODO: 해당 월로 넘어가면 그 때 생성 제너레이터?

const dailyNum = 1;
const weeklyNum = 7;

function* eventGenerator(eventData: Event | EventForm, repeatNum: number) {
  const date = new Date(eventData.date);

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setDate(date.getDate() + repeatNum);
  }
}

function* monthEventGenerator(eventData: Event | EventForm) {
  const baseDate = new Date(eventData.date);
  const baseDay = baseDate.getDate();

  const date = new Date(eventData.date);
  date.getDate();

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    const currentMonth = date.getMonth() + 1;

    date.setMonth(currentMonth);

    if (date.getDate() < baseDay) {
      date.setDate(0);
    }
  }
}

function* yearEventGenerator(eventData: Event | EventForm) {
  const baseDate = new Date(eventData.date);
  const baseMonth = baseDate.getMonth();

  const date = new Date(eventData.date);

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setFullYear(date.getFullYear() + 1);

    if (date.getMonth() !== baseMonth) {
      date.setMonth(baseMonth, 28);
    }
  }
}

export const getRepeatingEvents = (eventData: Event | EventForm) => {
  const eventList: Event[] = [];
  const eventDate = new Date(eventData.date);
  const days = getDaysInMonth(eventDate.getFullYear(), eventDate.getMonth() + 1);
  const limitedNum = new Date(eventData.date).getDate();

  if (eventData.repeat.type === 'daily') {
    const event = eventGenerator(eventData, dailyNum);

    for (let i = limitedNum; i <= days; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  } else if (eventData.repeat.type === 'weekly') {
    const event = eventGenerator(eventData, weeklyNum);

    for (let i = limitedNum; i <= days; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  } else if (eventData.repeat.type === 'monthly') {
    const event = monthEventGenerator(eventData);

    // 일단 36개월
    for (let i = 0; i <= 36; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  } else if (eventData.repeat.type === 'yearly') {
    const event = yearEventGenerator(eventData);

    // 일단 10년
    for (let i = 0; i <= 10; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  }
  return eventList;
};
