import { Event, EventForm } from '../types';
import { formatDate, getDaysInMonth } from './dateUtils';
//TODO: 해당 월로 넘어가면 그 때 생성 제너레이터?

const WEEK_NUM = 7;

function* dailyEventGenerator(eventData: Event | EventForm) {
  const date = new Date(eventData.date);

  const repeatInterval = eventData.repeat.interval || 1;

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setDate(date.getDate() + repeatInterval);
  }
}

function* weeklyEventGenerator(eventData: Event | EventForm) {
  const date = new Date(eventData.date);
  const repeatInterval = eventData.repeat.interval || 1;
  const week = repeatInterval * WEEK_NUM;

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setDate(date.getDate() + week);
  }
}

function* monthEventGenerator(eventData: Event | EventForm) {
  const baseDate = new Date(eventData.date);
  const baseDay = baseDate.getDate();
  const date = new Date(eventData.date);

  const repeatInterval = eventData.repeat.interval || 1;

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    const currentMonth = date.getMonth() + repeatInterval;

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

  const repeatInterval = eventData.repeat.interval || 1;

  while (!eventData.repeat.endDate) {
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setFullYear(date.getFullYear() + repeatInterval);

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
    const event = dailyEventGenerator(eventData);

    for (let i = limitedNum; i <= days; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  } else if (eventData.repeat.type === 'weekly') {
    const event = weeklyEventGenerator(eventData);

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
