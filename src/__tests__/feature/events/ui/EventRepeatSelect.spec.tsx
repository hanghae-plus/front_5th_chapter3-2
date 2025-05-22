import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import EventRepeatSelect from '../../../../feature/events/ui/EventRepeatSelect';

describe('EventRepeatSelect', () => {
  it('반복 유형의 옵션은 매일, 매주, 매월, 매년이 있다.', () => {
    const mockSetRepeatType = vi.fn();

    render(
      <ChakraProvider>
        <EventRepeatSelect repeatType="daily" setRepeatType={mockSetRepeatType} />
      </ChakraProvider>
    );

    expect(screen.getByText('매일')).toBeInTheDocument();
    expect(screen.getByText('매주')).toBeInTheDocument();
    expect(screen.getByText('매월')).toBeInTheDocument();
    expect(screen.getByText('매년')).toBeInTheDocument();
  });
});
