import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';

import { setupMockHandlerUpdating } from '../__mocks__/handlersUtils';
import App from '../App';
import { formatDate } from '../utils/dateUtils';

// 늘 isRepeating이 true라는걸 확신할 수 있나?
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

// 반복 유형 선택
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

it(
  '2월 29일에 매년 반복일정을 설정하면, 윤년이 아닌 해에는 2월 28일 또는 3월 1일에 생성되는지 확인한다.'
);
it('31일에 매월 반복일정을 설정하면, 31일이 없는 달에는 30일 또는 말일에 생성되는지 확인한다.');

// 반복 간격 설정
it.only('반복 유형별로 반복 간격(예: 2일마다, 3주마다, 2개월마다 등)을 설정할 수 있다.', async () => {
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

it('설정한 반복 간격에 따라 일정이 올바른 날짜에 생성되는지 확인한다.');

// 반복 종료
it("반복 종료 조건으로 '특정 날짜까지'를 지정할 수 있다.", async () => {
  const { user } = setup(<App />);

  const repeatEndDateInput = screen.getByTestId('repeat-end-date-input');
  expect(repeatEndDateInput).toBeInTheDocument();

  const repeatEndDate = new Date('2025-09-30');
  await user.type(repeatEndDateInput, formatDate(repeatEndDate));
  expect(repeatEndDateInput).toHaveValue(formatDate(repeatEndDate));
});

it("반복 종료 조건으로 '특정 횟수만큼'을 지정할 수 있다.");
it("반복 종료 조건으로 '종료 없음'을 지정할 수 있다.");
it(
  "반복 종료 조건이 '2025-09-30까지'로 설정된 경우, 해당 날짜 이후에는 반복 일정이 생성되지 않는다."
);

// 반복 일정 단일 수정
it('반복 일정의 한 인스턴스를 수정하면, 해당 일정이 반복에서 분리되어 단일 일정으로 변경된다.');

// 6. 반복 일정 단일 삭제
it('반복 일정의 한 인스턴스를 삭제하면, 해당 일정만 삭제되고 나머지 반복 일정에는 영향이 없다.');

// 3. 표시 테스트
it('캘린더 뷰에서 반복 일정이 일반 일정과 시각적으로 구분되어 표시된다.');
it('반복 일정에 반복 아이콘 또는 태그가 표시된다.');
it('반복 일정에서 분리된 단일 일정에는 반복 아이콘이 표시되지 않는다.');
