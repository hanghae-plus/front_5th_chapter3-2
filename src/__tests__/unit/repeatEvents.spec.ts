import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { ReactElement } from 'react';

import App from '../../App';

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user };
};

describe('일정 반복 기능', () => {
  it('반복 유형 [매일]을 선택하면 일정이 매일 반복된다.', async () => {
    const { user } = setup(<App />);
    const repeatType = screen.getByLabelText('repeat-type');
    await user.selectOptions(repeatType, 'daily');
    expect(repeatType).toHaveValue('daily');
    expect(screen.getByText('매일')).toBeInTheDocument();
  });

  it('반복 유형 [매주]를 선택하면 일정이 매주 반복된다.', async () => {
    const { user } = setup(<App />);
    const repeatType = screen.getByLabelText('repeat-type');
    await user.selectOptions(repeatType, 'weekly');
    expect(repeatType).toHaveValue('weekly');
    expect(screen.getByText('매주')).toBeInTheDocument();
  });

  it('반복 유형을 [매월]로 선택하고 반복 간격을 2로 설정하면 일정이 2개월마다 반복된다', async () => {
    const { user } = setup(<App />);

    // 반복 유형 선택
    const repeatType = screen.getByLabelText('repeat-type');
    await user.selectOptions(repeatType, 'monthly');

    // 반복 간격 입력
    const intervalInput = screen.getByLabelText('repeat-interval');
    await user.type(intervalInput, '{backspace}2');

    expect(intervalInput).toHaveValue(2);
    expect(screen.getByText('2개월마다')).toBeInTheDocument();
  });

  it('반복 유형을 [매년]로 선택하고 반복 간격을 1로 설정하면 일정이 1년마다 반복된다', async () => {
    const { user } = setup(<App />);

    const repeatType = screen.getByLabelText('repeat-type');
    await user.selectOptions(repeatType, 'yearly');

    const intervalInput = screen.getByLabelText('repeat-interval');
    await user.type(intervalInput, '{backspace}1');

    expect(intervalInput).toHaveValue(1);
    expect(screen.getByText('1년마다')).toBeInTheDocument();
  });

  it('캘린더 뷰에서 반복 일정에 반복 아이콘이 표시된다.', async () => {
    const { user } = setup(<App />);

    // 반복 설정
    const repeatType = screen.getByLabelText('repeat-type');
    await user.selectOptions(repeatType, 'daily');

    // 캘린더에서 아이콘 확인
    expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
  });

  it('반복 종료일을 2025년 9월 30일로 설정하면 2025년 9월 30일까지만 일정이 반복된다.', async () => {
    const { user } = setup(<App />);

    const endDateInput = screen.getByLabelText('repeat-end-date');
    await user.type(endDateInput, '2025-09-30');

    expect(endDateInput).toHaveValue('2025-09-30');
    expect(screen.getByText('~ 2025.09.30')).toBeInTheDocument();
  });

  it('반복일정을 수정하면 단일 일정으로 변경되고, 반복 아이콘이 사라진다.', async () => {
    const { user } = setup(<App />);

    // 반복 설정
    await user.selectOptions(screen.getByLabelText('repeat-type'), 'daily');

    // 수정 버튼 클릭
    await user.click(screen.getByRole('button', { name: /수정/i }));

    // 반복 해제
    await user.selectOptions(screen.getByLabelText('repeat-type'), 'none');

    expect(screen.queryByTestId('repeat-icon')).not.toBeInTheDocument();
  });

  it('반복일정을 삭제하면 해당 일정만 삭제된다.', async () => {
    const { user } = setup(<App />);

    // 반복 일정 생성
    await user.selectOptions(screen.getByLabelText('repeat-type'), 'daily');

    // 삭제 버튼 클릭
    await user.click(screen.getByRole('button', { name: /삭제/i }));

    expect(screen.queryByText('매일 반복')).not.toBeInTheDocument();
  });
});
