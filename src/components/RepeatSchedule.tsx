import { RepeatIcon } from '@chakra-ui/icons';
import { Box, HStack, Text, Tooltip } from '@chakra-ui/react';

import { Event } from '../types';

const REPEAT_TYPE_LABELS = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  yearly: '매년',
  none: '',
} as const;

interface RepeatProps {
  event: Event;
}

export const RepeatSchedule = ({ event }: RepeatProps) => {
  const getRepeatText = (): string => {
    if (event.repeat.type === 'none') return '';

    const baseLabel = REPEAT_TYPE_LABELS[event.repeat.type];
    const intervalText =
      event.repeat.interval === 1 ? baseLabel : `${event.repeat.interval}${baseLabel.slice(1)}마다`;

    const endDateText = event.repeat.endDate ? ` (${event.repeat.endDate}까지)` : '';

    return `${intervalText} 반복${endDateText}`;
  };

  return (
    <Box p={1} my={1} bg="gray.100" borderRadius="md" data-testid="event-item">
      <HStack spacing={1}>
        {event.repeat.type !== 'none' && (
          <Tooltip label={getRepeatText()}>
            <RepeatIcon data-testid="repeat-icon" boxSize="12px" color="blue.500" />
          </Tooltip>
        )}
        <Text fontSize="sm" noOfLines={1} data-testid="event-title">
          {event.title}
        </Text>
      </HStack>
    </Box>
  );
};
