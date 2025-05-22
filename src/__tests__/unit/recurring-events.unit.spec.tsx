import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AppProviders } from '../../AppProviders';
import { EventForm } from '../../components/EventForm';
import { EventFormProvider } from '../../contexts/EventFormContext';

// Mock hooks and contexts
vi.mock('../../contexts/EventContext', () => ({
  useEvents: () => ({
    events: [],
    revalidateEvents: vi.fn(),
  }),
}));

vi.mock('../../hooks', () => ({
  useEventOperations: () => ({
    saveEvent: vi.fn(),
    deleteEvent: vi.fn(),
  }),
  useOverlapDialog: () => ({
    openOverlapDialog: vi.fn(),
    OverlapDialog: () => null,
  }),
}));

describe('반복 일정 유닛 테스트', () => {
  // 실패 테스트: 반복 유형 선택
  it('반복 유형 선택 UI가 존재하지 않는다 (실패 테스트)', () => {
    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    const repeatCheckbox = screen.queryByLabelText('반복 일정');
    expect(repeatCheckbox).toBeNull();
  });

  // 실패 테스트: 반복 간격 설정
  it('반복 간격 설정 UI가 존재하지 않는다 (실패 테스트)', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    // 반복 설정 체크박스가 존재하는 경우 클릭
    const repeatCheckbox = screen.queryByLabelText('반복 일정');
    if (repeatCheckbox) {
      await user.click(repeatCheckbox);
    }

    // 반복 간격 입력 필드가 없어야 함
    const intervalInput = screen.queryByLabelText('반복 간격');
    expect(intervalInput).toBeNull();
  });

  // 실패 테스트: 반복 종료 설정
  it('반복 종료 설정 UI가 존재하지 않는다 (실패 테스트)', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    // 반복 설정 체크박스가 존재하는 경우 클릭
    const repeatCheckbox = screen.queryByLabelText('반복 일정');
    if (repeatCheckbox) {
      await user.click(repeatCheckbox);
    }

    // 반복 종료일 입력 필드가 없어야 함
    const endDateInput = screen.queryByLabelText('반복 종료일');
    expect(endDateInput).toBeNull();
  });

  // 성공 테스트: 반복 유형 선택
  it('반복 유형 선택 UI가 존재한다', () => {
    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    const repeatCheckbox = screen.getByLabelText('반복 일정');
    expect(repeatCheckbox).toBeInTheDocument();
  });

  // 성공 테스트: 반복 간격 설정
  it('반복 간격 설정 UI가 존재한다', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    // 반복 설정 체크박스 클릭
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 반복 간격 입력 필드가 있어야 함
    const intervalInput = screen.getByLabelText('반복 간격');
    expect(intervalInput).toBeInTheDocument();

    // 반복 간격 입력 테스트
    await user.clear(intervalInput);
    await user.type(intervalInput, '2');
    expect(intervalInput).toHaveValue(2);
  });

  // 성공 테스트: 반복 종료 설정
  it('반복 종료 설정 UI가 존재한다', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    // 반복 설정 체크박스 클릭
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 반복 종료일 입력 필드가 있어야 함
    const endDateInput = screen.getByLabelText('반복 종료일');
    expect(endDateInput).toBeInTheDocument();

    // 반복 종료일 입력 테스트
    await user.clear(endDateInput);
    await user.type(endDateInput, '2025-10-31');
    expect(endDateInput).toHaveValue('2025-10-31');
  });

  // 성공 테스트: 반복 유형 선택 가능
  it('반복 유형을 선택할 수 있다', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <EventFormProvider>
          <EventForm />
        </EventFormProvider>
      </AppProviders>
    );

    // 반복 설정 체크박스 클릭
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 반복 유형 선택 필드가 있어야 함
    const repeatTypeSelect = screen.getByLabelText('반복 유형');
    expect(repeatTypeSelect).toBeInTheDocument();

    // 반복 유형 선택 테스트
    await user.selectOptions(repeatTypeSelect, 'monthly');
    expect(repeatTypeSelect).toHaveValue('monthly');
  });
});
