/* eslint-disable no-unused-vars */
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
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
import React, { FC, useCallback } from 'react';

import { Event } from '../types';
import EventDetails from './EventDetails';

type EventListProps = {
  events: Event[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  editEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
  deleteRepeatEvents: (eventIds: string[]) => void;
  notifiedEvents: string[];
  isRepeating: boolean;
};

const EventList: FC<EventListProps> = ({
  events,
  searchTerm,
  setSearchTerm,
  editEvent,
  deleteEvent,
  deleteRepeatEvents,
  notifiedEvents,
  isRepeating,
}) => {
  const handleDeleteClick = useCallback(
    (id: string) => {
      if (isRepeating) {
        deleteRepeatEvents([id]);
      } else {
        deleteEvent(id);
      }
    },
    [isRepeating, deleteEvent, deleteRepeatEvents]
  );

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

      {events.length === 0 ? (
        <Text>검색 결과가 없습니다.</Text>
      ) : (
        events.map((event) => (
          <Box key={event.id} borderWidth={1} borderRadius="lg" p={3} width="100%">
            <HStack justifyContent="space-between">
              <EventDetails event={event} isNotified={notifiedEvents.includes(event.id)} />
              <HStack>
                <IconButton
                  data-testid={`edit-event-button-${event.title}`}
                  aria-label="Edit event"
                  icon={<EditIcon />}
                  onClick={() => editEvent(event)}
                />
                <IconButton
                  aria-label="Delete event"
                  icon={<DeleteIcon />}
                  onClick={() => handleDeleteClick(event.id)}
                />
              </HStack>
            </HStack>
          </Box>
        ))
      )}
    </VStack>
  );
};

export default React.memo(EventList);
