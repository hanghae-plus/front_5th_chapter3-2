import { randomUUID } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import express from 'express';

const app = express();
const port = 3000;
const __dirname = path.resolve();

app.use(express.json());

// 인메모리 데이터 저장소
let memoryDb = { events: [] };

// 초기 데이터 로드 (서버 시작 시 한 번만 실행)
const initializeDb = async () => {
  try {
    const data = await readFile(`${__dirname}/src/__mocks__/response/realEvents.json`, 'utf8');
    memoryDb = JSON.parse(data);
  } catch (error) {
    console.log('초기 데이터 파일이 없거나 로드할 수 없습니다. 빈 데이터로 시작합니다.');
    memoryDb = { events: [] };
  }
};

// 필요 시 데이터를 파일에 저장 (옵션)
const persistData = () => {
  if (process.env.PERSIST_DATA === 'true') {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/realEvents.json`,
      JSON.stringify(memoryDb, null, 2)
    );
  }
};

// 서버 시작 시 데이터 초기화
initializeDb();

app.get('/api/events', async (_, res) => {
  res.json(memoryDb);
});

app.post('/api/events', async (req, res) => {
  const newEvent = { ...req.body, id: randomUUID() };
  memoryDb.events = [...memoryDb.events, newEvent];
  persistData();
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  const eventIndex = memoryDb.events.findIndex((event) => event.id === id);

  if (eventIndex > -1) {
    const updatedEvent = { ...memoryDb.events[eventIndex], ...req.body };
    memoryDb.events[eventIndex] = updatedEvent;
    persistData();
    res.json(updatedEvent);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  memoryDb.events = memoryDb.events.filter((event) => event.id !== id);
  persistData();
  res.status(204).send();
});

app.post('/api/events-list', async (req, res) => {
  const repeatId = randomUUID();
  const newEvents = req.body.events.map((event) => {
    const isRepeatEvent = event.repeat.type !== 'none';
    return {
      id: randomUUID(),
      ...event,
      repeat: {
        ...event.repeat,
        id: isRepeatEvent ? repeatId : undefined,
      },
    };
  });

  memoryDb.events = [...memoryDb.events, ...newEvents];
  persistData();
  res.status(201).json(newEvents);
});

app.put('/api/events-list', async (req, res) => {
  let isUpdated = false;

  req.body.events.forEach((event) => {
    const eventIndex = memoryDb.events.findIndex((target) => target.id === event.id);
    if (eventIndex > -1) {
      isUpdated = true;
      memoryDb.events[eventIndex] = { ...memoryDb.events[eventIndex], ...event };
    }
  });

  if (isUpdated) {
    persistData();
    res.json(memoryDb.events);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events-list', async (req, res) => {
  memoryDb.events = memoryDb.events.filter((event) => !req.body.eventIds.includes(event.id));
  persistData();
  res.status(204).send();
});

// 테스트 데이터 초기화
app.post('/api/__reset', async (req, res) => {
  const data = await readFile(`${__dirname}/src/__mocks__/response/realEvents.json`, 'utf8');
  memoryDb = JSON.parse(data);
  res.status(200).send('Database reset');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
