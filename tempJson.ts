import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

export const createTempEventFile = () => {
  const id = randomUUID();
  const filePath = path.resolve(__dirname, `src/__mocks__/response/realEvents-${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ events: [] }));
  return { id, filePath };
};

export const deleteTempEventFile = (filePath: string) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};
