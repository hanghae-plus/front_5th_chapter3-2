import { Heading, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react';

import { EventTag } from '@/components/molecules/event-tag';
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
                    return <EventTag event={event} isNotified={isNotified} isRepeat={isRepeat} />;
                  })}
              </Td>
            ))}
          </Tr>
        </Tbody>
      </Table>
    </VStack>
  );
};
