import { Box, Flex } from '@chakra-ui/react';
import { useRef, useState } from 'react';

import CalendarHeader from './components/CalendarHeader';
import CalendarView from './components/CalendarView';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import NotificationDisplay from './components/NotificationDisplay';
import OverlapDialog from './components/OverlapDialog';
import { useCalendarView } from './hooks/useCalendarView';
import { useEventForm } from './hooks/useEventForm';
import { useEventOperations } from './hooks/useEventOperations';
import { useNotifications } from './hooks/useNotifications';
import { useSearch } from './hooks/useSearch';
import { Event } from './types';
import { findOverlappingEvents } from './utils/eventOverlap';

function App() {
  const {
    title,
    date,
    startTime,
    endTime,
    description,
    location,
    category,
    isRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    repeatEndDate,
    notificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    ...formMethods
  } = useEventForm();

  const { events, saveEvent, deleteEvent, deleteRepeatEvents } = useEventOperations(
    Boolean(editingEvent),
    isRepeating,
    () => setEditingEvent(null)
  );

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const cancelRef = useRef(null);

  const handleEventSubmit = async () => {
    const finalRepeatType = isRepeating ? (repeatType === 'none' ? 'daily' : repeatType) : 'none';
    const eventData = {
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: {
        type: isRepeating ? finalRepeatType : 'none',
        interval: repeatInterval,
        endDate: repeatEndDate || undefined,
      },
      notificationTime,
    } as Event;

    const overlapping = findOverlappingEvents(eventData, events);
    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
    } else {
      await saveEvent(eventData);
      formMethods.resetForm();
    }
  };

  const handleOverlapConfirm = () => {
    setIsOverlapDialogOpen(false);
    saveEvent({
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: {
        type: isRepeating ? repeatType : 'none',
        interval: repeatInterval,
        endDate: repeatEndDate || undefined,
      },
      notificationTime,
    });
    formMethods.resetForm();
  };

  const formProps = {
    title,
    date,
    startTime,
    endTime,
    description,
    location,
    category,
    isRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    repeatEndDate,
    notificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    ...formMethods,
    onSubmit: handleEventSubmit,
  };

  const calendarProps = {
    view,
    setView,
    currentDate,
    holidays,
    navigate,
    filteredEvents,
    notifiedEvents,
  };

  // useEffect(() => {
  //   if (isRepeating) {
  //     setRepeatType('daily');
  //   }
  // }, []);

  return (
    <Box w="full" h="100vh" m="auto" p={5}>
      <Flex gap={6} h="full">
        <EventForm {...formProps} />

        <Flex flex={1} direction="column" gap={5}>
          <CalendarHeader view={view} setView={setView} navigate={navigate} />
          <CalendarView {...calendarProps} />
        </Flex>

        <EventList
          events={filteredEvents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          editEvent={formMethods.editEvent}
          deleteEvent={deleteEvent}
          deleteRepeatEvents={deleteRepeatEvents}
          notifiedEvents={notifiedEvents}
          isRepeating={isRepeating}
        />
      </Flex>

      <OverlapDialog
        isOpen={isOverlapDialogOpen}
        onClose={() => setIsOverlapDialogOpen(false)}
        overlappingEvents={overlappingEvents}
        onConfirm={handleOverlapConfirm}
        cancelRef={cancelRef}
      />

      <NotificationDisplay notifications={notifications} setNotifications={setNotifications} />
    </Box>
  );
}

export default App;
