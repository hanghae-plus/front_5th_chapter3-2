import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { HStack, IconButton, Select } from '@chakra-ui/react';

import { View, viewOptions } from '../hooks';

interface CalendarViewControllerProps {
  view: View;
  onViewChange: (view: View) => void;
  onPrevClick: () => void;
  onNextClick: () => void;
}

export function CalendarViewController({
  view,
  onViewChange,
  onPrevClick,
  onNextClick,
}: CalendarViewControllerProps) {
  return (
    <HStack mx="auto" justifyContent="space-between">
      <IconButton aria-label="Previous" icon={<ChevronLeftIcon />} onClick={onPrevClick} />
      <Select aria-label="view" value={view} onChange={(e) => onViewChange(e.target.value as View)}>
        {viewOptions.map((view) => (
          <option key={view} value={view} style={{ textTransform: 'capitalize' }}>
            {view}
          </option>
        ))}
      </Select>
      <IconButton aria-label="Next" icon={<ChevronRightIcon />} onClick={onNextClick} />
    </HStack>
  );
}
