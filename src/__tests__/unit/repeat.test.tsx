import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupMockHandlerUpdating } from '../../__mocks__/handlersUtils';
import App from '../../App';
import { formatDate } from '../../utils/dateUtils';

// 늘 isRepeating이 true라는걸 확신할 수 있나?
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

it('일정 생성 시 반복 유형(매일, 매주, 매월, 매년)을 선택할 수 있다.', async () => {
  const { user } = setup(<App />);

  expect(screen.getByTestId('form-title')).toHaveTextContent('일정 추가');

  const repeatTypeSelect = screen.getByTestId('repeat-type-select');
  expect(repeatTypeSelect).toBeInTheDocument();

  expect(screen.getByRole('option', { name: '매일' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '매주' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '매월' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '매년' })).toBeInTheDocument();

  await user.selectOptions(repeatTypeSelect, '매일');
  expect(repeatTypeSelect).toHaveValue('daily');

  await user.selectOptions(repeatTypeSelect, '매주');
  expect(repeatTypeSelect).toHaveValue('weekly');

  await user.selectOptions(repeatTypeSelect, '매월');
  expect(repeatTypeSelect).toHaveValue('monthly');

  await user.selectOptions(repeatTypeSelect, '매년');
  expect(repeatTypeSelect).toHaveValue('yearly');
});

it('일정 수정 시 반복 유형(매일, 매주, 매월, 매년)을 선택할 수 있다.', async () => {
  const { user } = setup(<App />);

  setupMockHandlerUpdating();

  await user.click(await screen.findByLabelText('Edit event'));

  expect(screen.getByTestId('form-title')).toHaveTextContent('일정 수정');

  const repeatCheckbox = screen.getByTestId('repeat-checkbox');
  await user.click(repeatCheckbox);

  const repeatTypeSelect = screen.getByTestId('repeat-type-select');
  expect(repeatTypeSelect).toBeInTheDocument();

  expect(screen.getByRole('option', { name: '매일' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '매주' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '매월' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '매년' })).toBeInTheDocument();

  await user.selectOptions(repeatTypeSelect, '매일');
  expect(repeatTypeSelect).toHaveValue('daily');

  await user.selectOptions(repeatTypeSelect, '매주');
  expect(repeatTypeSelect).toHaveValue('weekly');

  await user.selectOptions(repeatTypeSelect, '매월');
  expect(repeatTypeSelect).toHaveValue('monthly');

  await user.selectOptions(repeatTypeSelect, '매년');
  expect(repeatTypeSelect).toHaveValue('yearly');
});

it('반복 유형별로 반복 간격(예: 2일마다, 3주마다, 2개월마다 등)을 설정할 수 있다.', async () => {
  const { user } = setup(<App />);

  const repeatTypeSelect = screen.getByTestId('repeat-type-select');
  expect(repeatTypeSelect).toBeInTheDocument();

  await user.selectOptions(repeatTypeSelect, '매일');
  expect(repeatTypeSelect).toHaveValue('daily');

  const repeatIntervalInput = screen.getByTestId('repeat-interval-input');
  expect(repeatIntervalInput).toBeInTheDocument();

  await user.clear(repeatIntervalInput);
  await user.type(repeatIntervalInput, '2');
  expect(repeatIntervalInput).toHaveValue(2);

  await user.selectOptions(repeatTypeSelect, '매일');
  expect(repeatTypeSelect).toHaveValue('daily');

  await user.clear(repeatIntervalInput);
  await user.type(repeatIntervalInput, '3');
  expect(repeatIntervalInput).toHaveValue(3);

  await user.selectOptions(repeatTypeSelect, '매주');
  expect(repeatTypeSelect).toHaveValue('weekly');

  await user.clear(repeatIntervalInput);
  await user.type(repeatIntervalInput, '2');
  expect(repeatIntervalInput).toHaveValue(2);

  await user.selectOptions(repeatTypeSelect, '매월');
  expect(repeatTypeSelect).toHaveValue('monthly');
});

it("반복 종료 조건으로 '특정 날짜까지'를 지정할 수 있다.", async () => {
  const { user } = setup(<App />);

  const repeatEndDateInput = screen.getByTestId('repeat-end-date-input');
  expect(repeatEndDateInput).toBeInTheDocument();

  const repeatEndDate = new Date('2025-09-30');
  await user.type(repeatEndDateInput, formatDate(repeatEndDate));
  expect(repeatEndDateInput).toHaveValue(formatDate(repeatEndDate));
});

it("반복 종료 조건으로 '특정 횟수만큼'을 지정할 수 있다.", async () => {
  const { user } = setup(<App />);

  const repeatEndCountInput = screen.getByTestId('repeat-end-count-input');
  expect(repeatEndCountInput).toBeInTheDocument();

  await user.clear(repeatEndCountInput);
  await user.type(repeatEndCountInput, '10');
  expect(repeatEndCountInput).toHaveValue(10);
});

it("반복 종료 조건으로 '종료 없음'을 지정할 수 있다.", async () => {
  const { user } = setup(<App />);

  const repeatNoRepeatCheckbox = screen
    .getByTestId('repeat-no-repeat-checkbox')
    .querySelector('input')!;
  expect(repeatNoRepeatCheckbox).toBeInTheDocument();

  await user.click(repeatNoRepeatCheckbox);
  expect(repeatNoRepeatCheckbox).toBeChecked();
});
