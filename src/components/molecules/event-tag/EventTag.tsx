import { BellIcon, RepeatIcon } from '@chakra-ui/icons';
import { Box, HStack, Text } from '@chakra-ui/react';

import { Event } from '@/types';

interface EventTagProps {
  event: Event;
  isNotified: boolean;
  isRepeat: boolean;
}

export const EventTag = ({ event, isNotified, isRepeat }: EventTagProps) => {
  return (
    <Box
      p={1}
      my={1}
      bg={isNotified ? 'red.100' : isRepeat ? 'blue.100' : 'gray.100'}
      borderRadius="md"
      fontWeight={isNotified ? 'bold' : 'normal'}
      color={isNotified ? 'red.500' : isRepeat ? 'blue.500' : 'inherit'}
      data-testid="schedule-tag"
    >
      <HStack spacing={1}>
        {isNotified ? (
          <BellIcon data-testid="bell-icon" />
        ) : isRepeat ? (
          <RepeatIcon data-testid="repeat-icon" />
        ) : null}
        <Text fontSize="sm" noOfLines={1}>
          {event.title}
        </Text>
      </HStack>
    </Box>
  );
};
