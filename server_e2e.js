import { randomUUID } from 'crypto';

import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

const testEvents = [
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
  {
    id: '09702fb3-a478-40b3-905e-9ab3c8849dcd',
    title: '점심 약속',
    date: '2025-05-21',
    startTime: '12:30',
    endTime: '13:30',
    description: '동료와 점심 식사',
    location: '회사 근처 식당',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: 'da3ca408-836a-4d98-b67a-ca389d07552b',
    title: '프로젝트 마감',
    date: '2025-05-25',
    startTime: '09:00',
    endTime: '18:00',
    description: '분기별 프로젝트 마감',
    location: '사무실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: 'dac62941-69e5-4ec0-98cc-24c2a79a7f81',
    title: '생일 파티',
    date: '2025-05-28',
    startTime: '19:00',
    endTime: '22:00',
    description: '친구 생일 축하',
    location: '친구 집',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: '80d85368-b4a4-47b3-b959-25171d49371f',
    title: '운동',
    date: '2025-05-22',
    startTime: '18:00',
    endTime: '19:00',
    description: '주간 운동',
    location: '헬스장',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
];

// 🧠 메모리 기반 "DB"
let db = [...testEvents];

// 🧪 테스트용: DB 초기화
app.post('/__reset', (_, res) => {
  db = [...testEvents];
  res.status(204).send();
});

// 🔍 GET 모든 이벤트
app.get('/api/events', (_, res) => {
  res.json({ events: db });
});

// ➕ POST 단일 이벤트 추가
app.post('/api/events', (req, res) => {
  const newEvent = { id: randomUUID(), ...req.body };
  db.push(newEvent);
  res.status(201).json(newEvent);
});

// ✏️ PUT 단일 이벤트 수정
app.put('/api/events/:id', (req, res) => {
  const index = db.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).send('Not found');
  db[index] = { ...db[index], ...req.body };
  res.json(db[index]);
});

// 🗑 DELETE 단일 이벤트 삭제
app.delete('/api/events/:id', (req, res) => {
  db = db.filter((e) => e.id !== req.params.id);
  res.status(204).send();
});

// ➕ POST 반복 일정 (여러 개 추가)
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

// ✏️ PUT 반복 일정 여러 개 수정
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

// 🗑 DELETE 여러 개 삭제
app.delete('/api/events-list', (req, res) => {
  const ids = req.body.eventIds || [];
  db = db.filter((e) => !ids.includes(e.id));
  res.status(204).send();
});

// 🚀 서버 시작
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
