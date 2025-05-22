import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

import { handlers } from './__mocks__/handlers';

// ! Hard 여기 제공 안함
vi.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: vi.fn(), // 함수 호출을 추적할 수 있도록 vi.fn()으로 변경
  setupGlobalFocusEvents: vi.fn(),
  default: vi.fn(), // default export도 모의 처리
}));

/* msw */
export const server = setupServer(...handlers);

vi.stubEnv('TZ', 'UTC');

beforeAll(() => {
  server.listen();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

beforeEach(() => {
  expect.hasAssertions(); // ? Med: 이걸 왜 써야하는지 물어보자

  vi.setSystemTime(new Date('2025-10-01')); // ? Med: 이걸 왜 써야하는지 물어보자
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  server.close();
});
