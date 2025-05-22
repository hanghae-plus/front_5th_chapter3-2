import { BellIcon, DeleteIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Box,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ReactElement } from 'react';

import { Event } from '../types';
import { RepeatEventIndicator } from './RepeatComponent';

interface EventListProps {
  filteredEvents: Event[];
  notifiedEvents: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  editEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
  notificationOptions: Array<{ value: number; label: string }>;
}

export const EventList = ({
  filteredEvents,
  notifiedEvents,
  searchTerm,
  setSearchTerm,
  editEvent,
  deleteEvent,
  notificationOptions,
}: EventListProps): ReactElement => {
  return (
    <VStack data-testid="event-list" w="500px" h="full" overflowY="auto">
      <FormControl>
        <FormLabel>일정 검색</FormLabel>
        <Input
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </FormControl>

      {filteredEvents.length === 0 ? (
        <Text>검색 결과가 없습니다.</Text>
      ) : (
        filteredEvents.map((event) => (
          <Box key={event.id} borderWidth={1} borderRadius="lg" p={3} width="100%">
            <HStack justifyContent="space-between">
              <VStack align="start">
                <HStack>
                  {notifiedEvents.includes(event.id) && <BellIcon color="red.500" />}
                  {event.repeat && event.repeat.type !== 'none' && (
                    <RepeatIcon data-testid="repeat-icon" color="blue.500" />
                  )}
                  <Text
                    fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                    color={notifiedEvents.includes(event.id) ? 'red.500' : 'inherit'}
                  >
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
                  <RepeatEventIndicator
                    type={event.repeat.type}
                    interval={event.repeat.interval}
                    endDate={event.repeat.endDate}
                  />
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
                  icon={<EditIcon />}
                  onClick={() => editEvent(event)}
                />
                <IconButton
                  aria-label="Delete event"
                  icon={<DeleteIcon />}
                  onClick={() => deleteEvent(event.id)}
                />
              </HStack>
            </HStack>
          </Box>
        ))
      )}
    </VStack>
  );
};
