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

import { WEEK_DAYS } from '@/config/constants';
import {
  useCalendarViewContext,
  useNotificationsContext,
  useSearchContext,
} from '@/hooks/contexts';
import { formatDate, formatMonth, getEventsForDay, getWeeksAtMonth } from '@/utils/dateUtils';

export const MonthView = () => {
  const { notifiedEvents } = useNotificationsContext();
  const { currentDate, holidays } = useCalendarViewContext();
  const { filteredEvents } = useSearchContext();

  const weeks = getWeeksAtMonth(currentDate);

  return (
    <VStack data-testid="month-view" align="stretch" w="full" spacing={4}>
      <Heading size="md">{formatMonth(currentDate)}</Heading>
      <Table variant="simple" w="full">
        <Thead>
          <Tr>
            {WEEK_DAYS.map((day) => (
              <Th key={day} width="14.28%">
                {day}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {weeks.map((week, weekIndex) => (
            <Tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                const dateString = day ? formatDate(currentDate, day) : '';
                const holiday = holidays[dateString];

                return (
                  <Td
                    key={dayIndex}
                    height="100px"
                    verticalAlign="top"
                    width="14.28%"
                    position="relative"
                  >
                    {day && (
                      <>
                        <Text fontWeight="bold">{day}</Text>
                        {holiday && (
                          <Text color="red.500" fontSize="sm">
                            {holiday}
                          </Text>
                        )}
                        {getEventsForDay(filteredEvents, day).map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);
                          const isRepeating = event.repeat.type !== 'none';
                          return (
                            <Box
                              key={event.id}
                              p={1}
                              my={1}
                              bg={isNotified ? 'red.100' : 'gray.100'}
                              borderRadius="md"
                              fontWeight={isNotified ? 'bold' : 'normal'}
                              color={isNotified ? 'red.500' : 'inherit'}
                              data-testid={`event-id-${event.id}`}
                            >
                              <HStack spacing={1}>
                                {isNotified && <BellIcon data-testid={'bell-icon'} />}
                                {isRepeating && <RepeatIcon data-testid={'repeat-icon'} />}
                                <Text fontSize="sm" noOfLines={1}>
                                  {event.title}
                                </Text>
                              </HStack>
                            </Box>
                          );
                        })}
                      </>
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};
