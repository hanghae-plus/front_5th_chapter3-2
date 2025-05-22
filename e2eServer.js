import { randomUUID } from 'crypto';

import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

const mockData = {
  id: '03e047a7-e05d-4770-9319-f235ee995513',
  title: '팀 회의',
  date: '2025-05-22',
  startTime: '10:00',
  endTime: '11:00',
  description: '주간 팀 미팅',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 1,
};
let mockDB = [mockData];

app.post('/api/mock-reset', (_, res) => {
  mockDB = [mockData];

  res.status(204).send();
});

app.get('/api/events', (_, res) => res.json({ events: mockDB }));

app.post('/api/events', (req, res) => {
  const newEvent = { id: randomUUID(), ...req.body };
  mockDB.push(newEvent);

  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const index = mockDB.findIndex((e) => e.id === req.params.id);

  if (index === -1) return res.status(404).send('Not found');
  mockDB[index] = { ...mockDB[index], ...req.body };

  res.json(mockDB[index]);
});

app.delete('/api/events/:id', (req, res) => {
  mockDB = mockDB.filter((e) => e.id !== req.params.id);

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
  mockDB.push(...newEvents);

  res.status(201).json(newEvents);
});

app.put('/api/events-list', (req, res) => {
  let updated = false;
  req.body.events.forEach((incoming) => {
    const idx = mockDB.findIndex((e) => e.id === incoming.id);
    if (idx !== -1) {
      mockDB[idx] = { ...mockDB[idx], ...incoming };
      updated = true;
    }
  });

  if (updated) {
    res.json(mockDB);
  } else {
    res.status(404).send('Not found');
  }
});

app.delete('/api/events-list', (req, res) => {
  const ids = req.body.eventIds || [];
  mockDB = mockDB.filter((e) => !ids.includes(e.id));

  res.status(204).send();
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
