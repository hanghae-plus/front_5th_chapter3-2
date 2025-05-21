import { BellIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';

import { Event } from '@/types';
import { formatWeek, getWeekDates } from '@/utils/dateUtils';
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

interface WeeklyCalendarProps {
  currentDate: Date;
  filteredEvents: Event[];
  notifiedEvents: string[];
}

export const WeeklyCalendar = ({
  currentDate,
  filteredEvents,
  notifiedEvents,
}: WeeklyCalendarProps) => {
  const weekDates = getWeekDates(currentDate);
  return (
    <VStack data-testid="week-view" align="stretch" w="full" spacing={4}>
      <Heading size="md">{formatWeek(currentDate)}</Heading>
      <Table variant="simple" w="full">
        <Thead>
          <Tr>
            {weekDays.map((day) => (
              <Th key={day} width="14.28%">
                {day}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            {weekDates.map((date) => (
              <Td key={date.toISOString()} height="100px" verticalAlign="top" width="14.28%">
                <Text fontWeight="bold">{date.getDate()}</Text>
                {filteredEvents
                  .filter((event) => new Date(event.date).toDateString() === date.toDateString())
                  .map((event) => {
                    const isNotified = notifiedEvents.includes(event.id);
                    const isRepeat = event.repeat.type !== 'none';
                    return (
                      <Box
                        key={event.id}
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
                  })}
              </Td>
            ))}
          </Tr>
        </Tbody>
      </Table>
    </VStack>
  );
};
