import { BellIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react';

import EventSearchInput from '@/app/widgets/EventSidebar/ui/EventSearchInput';
import { Event } from '@/types';

interface Props {
  searchTerm: string;
  setSearchTerm: (_v: string) => void;
  filteredEvents: Event[];
  notifiedEvents: string[];
  notificationOptions: { value: number; label: string }[];
  editEvent: (_event: Event) => void;
  deleteEvent: (_id: string) => void;
}

const EventList = ({
  searchTerm,
  setSearchTerm,
  filteredEvents,
  notifiedEvents,
  notificationOptions,
  editEvent,
  deleteEvent,
}: Props) => {
  return (
    <VStack data-testid="event-list" w="500px" h="full" overflowY="auto">
      <EventSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {filteredEvents.length === 0 ? (
        <Text>검색 결과가 없습니다.</Text>
      ) : (
        filteredEvents.map((event) => {
          const isNotified = notifiedEvents.includes(event.id ?? '');
          return (
            <Box key={event.id} borderWidth={1} borderRadius="lg" p={3} width="100%">
              <HStack justifyContent="space-between">
                <VStack align="start">
                  <HStack>
                    {isNotified && <BellIcon color="red.500" />}
                    <Text
                      fontWeight={isNotified ? 'bold' : 'normal'}
                      color={isNotified ? 'red.500' : 'inherit'}
                    >
                      {event.repeat?.interval !== 0 && ' 🔁\n'}
                      {event.title}
                    </Text>
                  </HStack>
                  <Text>{event.date}</Text>
                  <Text>
                    {event.startTime} - {event.endTime}
                  </Text>
                  <Text>{event.description}</Text>
                  <Text>{event.location}</Text>
                  <Text>카테고리: {event.category}</Text>
                  {event.repeat && event.repeat.type !== 'none' && (
                    <Text>
                      반복: {event.repeat.interval}
                      {event.repeat.type === 'daily' && '일'}
                      {event.repeat.type === 'weekly' && '주'}
                      {event.repeat.type === 'monthly' && '월'}
                      {event.repeat.type === 'yearly' && '년'}
                      마다
                      {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                    </Text>
                  )}
                  <Text>
                    알림:{' '}
                    {
                      notificationOptions.find((option) => option.value === event.notificationTime)
                        ?.label
                    }
                  </Text>
                </VStack>
                <HStack>
                  <IconButton
                    aria-label="Edit event"
                    data-testid={`edit-event-button-${event.id}`}
                    icon={<EditIcon />}
                    onClick={() => editEvent(event)}
                  />
                  <IconButton
                    aria-label="Delete event"
                    data-testid={`delete-event-button-${event.id}`}
                    icon={<DeleteIcon />}
                    onClick={() => deleteEvent(event.id)}
                  />
                </HStack>
              </HStack>
            </Box>
          );
        })
      )}
    </VStack>
  );
};

export default EventList;
