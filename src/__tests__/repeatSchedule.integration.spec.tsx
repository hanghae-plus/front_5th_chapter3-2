import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App.tsx';

const getEventCard = (title: string) =>
  screen.getAllByText(title).find((el) => el.closest('[role="group"]') || el.closest('div'));

describe('반복 일정 단일 및 전체 수정/삭제 통합 테스트', () => {
  beforeEach(() => {
    render(<App />);
  });

  it('단일 일정 수정 시 반복이 해제된다', async () => {
    // 1. 일정 추가 - 반복 매일 3회
    await userEvent.type(screen.getByLabelText(/제목/i), '테스트 반복');
    await userEvent.type(screen.getByLabelText(/날짜/i), '2025-01-01');
    await userEvent.click(screen.getByLabelText(/반복 일정/i));
    await userEvent.selectOptions(screen.getByLabelText(/반복 유형/i), 'daily');
    await userEvent.type(screen.getByLabelText(/반복 간격/i), '1');
    await userEvent.type(screen.getByLabelText(/반복 종료일/i), '2025-01-03');
    await userEvent.click(screen.getByTestId('event-submit-button'));

    // 2. 목록 에서 두 번째 일정 수정
    const eventToEdit = await screen.findByText('2025-01-02');
    const card = eventToEdit.closest('div');
    const editButton = within(card!).getByLabelText(/Edit event/i);
    fireEvent.click(editButton);

    await userEvent.clear(screen.getByLabelText(/제목/i));
    await userEvent.type(screen.getByLabelText(/제목/i), '수정된 일정');
    await userEvent.click(screen.getByTestId('event-submit-button'));

    expect(await screen.findByText('수정된 일정')).toBeInTheDocument();
    expect(screen.queryByText('반복:')).not.toBeInTheDocument(); // 수정된 일정은 반복이 사라짐
  });

  it('단일 삭제 시 나머지 반복 일정은 유지된다', async () => {
    const eventToDelete = await screen.findByText('2025-01-03');
    const card = eventToDelete.closest('div');
    const deleteBtn = within(card!).getByLabelText(/Delete event/i);
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('2025-01-03')).not.toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('2025-01-02')).toBeInTheDocument();
  });

  it('전체 일정을 수정하면 반복 그룹 모두 반영된다', async () => {
    expect(true).toBe(false);
  });

  it('전체 일정을 삭제하면 반복 그룹이 모두 사라진다', async () => {
    expect(true).toBe(false);
  });
});
