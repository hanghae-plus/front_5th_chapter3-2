import { randomUUID } from 'crypto';

import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

// 메모리 기반 DB
let db = [
  // 초기 상태 일정 예시 (선택적으로 포함 가능)
  {
    id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
    title: '팀 회의',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  // 기타 일정들...
];

// 상태 초기화 API
app.post('/__reset', (_, res) => {
  db = [];
  res.status(204).send();
});

// 이벤트 CRUD API
app.get('/api/events', (_, res) => res.json({ events: db }));

app.post('/api/events', (req, res) => {
  const newEvent = { id: randomUUID(), ...req.body };
  db.push(newEvent);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const index = db.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).send('Not found');
  db[index] = { ...db[index], ...req.body };
  res.json(db[index]);
});

app.delete('/api/events/:id', (req, res) => {
  db = db.filter((e) => e.id !== req.params.id);
  res.status(204).send();
});

app.post('/api/events-list', (req, res) => {
  const repeatId = randomUUID();
  const newEvents = req.body.events.map((event) => {
    const isRepeat = event.repeat?.type !== 'none';
    return {
      id: randomUUID(),
      ...event,
      repeat: {
        ...event.repeat,
        id: isRepeat ? repeatId : undefined,
      },
    };
  });
  db.push(...newEvents);
  res.status(201).json(newEvents);
});

app.put('/api/events-list', (req, res) => {
  let updated = false;
  req.body.events.forEach((incoming) => {
    const idx = db.findIndex((e) => e.id === incoming.id);
    if (idx !== -1) {
      db[idx] = { ...db[idx], ...incoming };
      updated = true;
    }
  });
  if (updated) res.json(db);
  else res.status(404).send('Not found');
});

app.delete('/api/events-list', (req, res) => {
  const ids = req.body.eventIds || [];
  db = db.filter((e) => !ids.includes(e.id));
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
