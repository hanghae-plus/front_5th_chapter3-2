import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import EventRepeatEndSelect from '../../../../feature/events/ui/EventRepeatEndSelect';

describe('EventRepeatEndSelect', () => {
  it('반복 종료의 옵션은 종료일, 종료 횟수가 있다.', () => {
    const mockSetRepeatEndType = vi.fn();

    render(
      <ChakraProvider>
        <EventRepeatEndSelect repeatEndType="endDate" setRepeatEndType={mockSetRepeatEndType} />
      </ChakraProvider>
    );

    expect(screen.getByText('종료일')).toBeInTheDocument();
    expect(screen.getByText('종료 횟수')).toBeInTheDocument();
  });
});
