import { Event, EventForm } from '../types';
import { formatDate } from './dateUtils';
//TODO: 해당 월로 넘어가면 그 때 생성 제너레이터? 다음 버튼을 클릭하면 다음달에 적용

const WEEK_NUM = 7;

function* dailyEventGenerator(eventData: Event | EventForm) {
  const date = new Date(eventData.date);
  const { interval, endDate } = eventData.repeat;
  const repeatInterval = interval || 1;

  while (true) {
    if (endDate && date > new Date(endDate)) break;
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setDate(date.getDate() + repeatInterval);
  }
}

function* weeklyEventGenerator(eventData: Event | EventForm) {
  const { interval, endDate } = eventData.repeat;

  const date = new Date(eventData.date);
  const repeatInterval = interval || 1;
  const week = repeatInterval * WEEK_NUM;

  while (true) {
    if (endDate && date > new Date(endDate)) break;
    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setDate(date.getDate() + week);
  }
}

function* monthEventGenerator(eventData: Event | EventForm) {
  const { interval, endDate } = eventData.repeat;

  const baseDate = new Date(eventData.date);
  const baseDay = baseDate.getDate();
  const date = new Date(eventData.date);

  const repeatInterval = interval || 1;

  while (true) {
    if (endDate && date > new Date(endDate)) break;

    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    const currentMonth = date.getMonth() + repeatInterval;
    date.setMonth(currentMonth);

    if (date.getDate() < baseDay) {
      date.setDate(0);
    }
  }
}

function* yearEventGenerator(eventData: Event | EventForm) {
  const { interval, endDate } = eventData.repeat;

  const baseDate = new Date(eventData.date);
  const baseMonth = baseDate.getMonth();

  const date = new Date(eventData.date);

  const repeatInterval = interval || 1;

  while (true) {
    if (endDate && date > new Date(endDate)) break;

    yield { ...eventData, id: 'fixed-id', date: formatDate(date) };
    date.setFullYear(date.getFullYear() + repeatInterval);

    if (date.getMonth() !== baseMonth) {
      date.setMonth(baseMonth, 28);
    }
  }
}

export const getRepeatingEvents = (eventData: Event | EventForm) => {
  const eventList: Event[] = [];

  if (eventData.repeat.type === 'none') return eventList;

  if (eventData.repeat.type === 'daily') {
    const event = dailyEventGenerator(eventData);

    // 일단 3개월
    for (let i = 0; i <= 90; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  }
  if (eventData.repeat.type === 'weekly') {
    const event = weeklyEventGenerator(eventData);

    for (let i = 0; i <= 90; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  }
  if (eventData.repeat.type === 'monthly') {
    const event = monthEventGenerator(eventData);

    // 일단 36개월
    for (let i = 0; i <= 36; i++) {
      const { value, done } = event.next();
      if (done) break;
      eventList.push(value);
    }
  }
  if (eventData.repeat.type === 'yearly') {
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
