import { randomUUID } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import express from 'express';

const app = express();
const port = 3000;
const __dirname = path.resolve();
app.use(express.json());

const DATA_PATH = `${__dirname}/src/__mocks__/response/realEvents.json`;

const getEvents = async () => {
  const data = await readFile(DATA_PATH, 'utf8');
  return JSON.parse(data);
};

const saveEvents = (events) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ events }, null, 2));
};

app.get('/api/events', async (_, res) => {
  const events = await getEvents();
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  const events = await getEvents();
  const newEvent = { id: randomUUID(), ...req.body };
  saveEvents([...events.events, newEvent]);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', async (req, res) => {
  const events = await getEvents();
  const id = req.params.id;
  const idx = events.events.findIndex((e) => e.id === id);
  if (idx === -1) return res.status(404).send('Event not found');

  events.events[idx] = { ...events.events[idx], ...req.body };
  saveEvents(events.events);
  res.json(events.events[idx]);
});

app.delete('/api/events/:id', async (req, res) => {
  const events = await getEvents();
  const filtered = events.events.filter((e) => e.id !== req.params.id);
  saveEvents(filtered);
  res.status(204).send();
});

app.post('/api/events-list', async (req, res) => {
  const events = await getEvents();
  const repeatId = randomUUID();
  const newEvents = req.body.events.map((event) => {
    const isRepeat = event.repeat.type !== 'none';
    return {
      id: randomUUID(),
      ...event,
      repeat: {
        ...event.repeat,
        id: isRepeat ? repeatId : undefined,
      },
    };
  });
  saveEvents([...events.events, ...newEvents]);
  res.status(201).json(newEvents);
});

app.put('/api/events-list', async (req, res) => {
  const events = await getEvents();
  let changed = false;
  const updated = events.events.map((ev) => {
    const incoming = req.body.events.find((e) => e.id === ev.id);
    if (incoming) {
      changed = true;
      return { ...ev, ...incoming };
    }
    return ev;
  });
  if (!changed) return res.status(404).send('Event not found');
  saveEvents(updated);
  res.json(updated);
});

app.delete('/api/events-list', async (req, res) => {
  const { eventIds = [] } = req.body;
  const events = await getEvents();
  const filtered = events.events.filter((ev) => !eventIds.includes(ev.id));
  saveEvents(filtered);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`E2E test server running at http://localhost:${port}`);
});
