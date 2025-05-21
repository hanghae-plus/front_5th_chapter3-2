import { Box, Flex, useToast } from '@chakra-ui/react';

import { AlertContainer } from '@/components/organisms/alert-container';
import { InvalidMonthlyRepeatModal } from '@/components/organisms/invalid-monthly-repeat-modal';
import { LeapDayUnsupportedModal } from '@/components/organisms/leap-day-unsurpported-modal';
import { OverlappingModal } from '@/components/organisms/overlapping-modal';
import { AddScheduleTemplate } from '@/components/templates/add-schedule/AddScheduleTemplate.tsx';
import { ViewScheduleTemplate } from '@/components/templates/view-schedule';
import { useEventForm } from '@/hooks/useEventForm.ts';
import { useEventOperations } from '@/hooks/useEventOperations.ts';
import { useInvalidMonthlyRepeatModal } from '@/hooks/useInvalidMonthlyRepeatModal';
import { useLeapMonthModal } from '@/hooks/useLeapMonthModal';
import { useNotifications } from '@/hooks/useNotifications.ts';
import { useOverlapModal } from '@/hooks/useOverlapModal';
import { convertFormToEventData, convertFormToEventDataRepeating } from '@/utils/eventFormUtils';
import { findOverlappingEvents } from '@/utils/eventOverlap';

export function MainPage() {
  const {
    eventForm,
    handleOnChangeEvent,
    isRepeating,
    setIsRepeating,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    resetForm,
    editEvent,
  } = useEventForm();
  const { events, saveEvent, deleteEvent, saveRepeatingEvents, updateEventToRepeatingEvent } =
    useEventOperations(Boolean(editingEvent), () => setEditingEvent(null));
  const { notifications, notifiedEvents, removeNotification } = useNotifications(events);
  const { isOverlapModalOpen, overlappingEvents, openModal, closeModal, isOverlapping } =
    useOverlapModal();
  const { isLeapMonthModalOpen, isLeapDayYearlyRepeat, setIsLeapMonthModalOpen } =
    useLeapMonthModal();
  const {
    isInvalidMonthlyRepeatModalOpen,
    isInvalidMonthlyRepeat,
    setIsInvalidMonthlyRepeatModalOpen,
  } = useInvalidMonthlyRepeatModal();

  const toast = useToast();

  const addOrUpdateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.startTime || !eventForm.endTime) {
      toast({
        title: '필수 정보를 모두 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (startTimeError || endTimeError) {
      toast({
        title: '시간 설정을 확인해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (editingEvent && isRepeating) {
      if (isLeapDayYearlyRepeat(eventForm)) {
        return setIsLeapMonthModalOpen(true);
      }

      if (isInvalidMonthlyRepeat(eventForm)) {
        return setIsInvalidMonthlyRepeatModalOpen(true);
      }

      const eventData = convertFormToEventDataRepeating(eventForm, null);
      await updateEventToRepeatingEvent(eventData);
      resetForm();
    }

    if (editingEvent) {
      const eventData = convertFormToEventData(eventForm, isRepeating, editingEvent);

      if (isOverlapping(eventData, events)) {
        openModal(findOverlappingEvents(eventData, events));
      } else {
        await saveEvent(eventData);
        resetForm();
      }
      return;
    }

    // 새 이벤트 생성 처리
    if (isRepeating) {
      if (isLeapDayYearlyRepeat(eventForm)) {
        return setIsLeapMonthModalOpen(true);
      }

      if (isInvalidMonthlyRepeat(eventForm)) {
        return setIsInvalidMonthlyRepeatModalOpen(true);
      }

      const eventData = convertFormToEventDataRepeating(eventForm, null);
      if (isOverlapping(eventData[0], events)) {
        openModal(findOverlappingEvents(eventData[0], events));
      } else {
        await saveRepeatingEvents(eventData);
        resetForm();
      }
    } else {
      const eventData = convertFormToEventData(eventForm, isRepeating, null);

      if (isOverlapping(eventData, events)) {
        openModal(findOverlappingEvents(eventData, events));
      } else {
        await saveEvent(eventData);
        resetForm();
      }
    }
  };

  const handleSaveOverlapEvent = () => {
    closeModal();
    saveEvent(convertFormToEventData(eventForm, isRepeating, editingEvent));
  };

  return (
    <Box w="full" h="100vh" m="auto" p={5}>
      <Flex gap={6} h="full">
        <AddScheduleTemplate
          addOrUpdateEvent={addOrUpdateEvent}
          handleOnChangeEvent={handleOnChangeEvent}
          eventForm={eventForm}
          isEditEvent={!!editingEvent}
          startTimeError={startTimeError}
          endTimeError={endTimeError}
          isRepeating={isRepeating}
          setIsRepeating={setIsRepeating}
        />

        <ViewScheduleTemplate
          events={events}
          notifiedEvents={notifiedEvents}
          editEvent={editEvent}
          deleteEvent={deleteEvent}
        />
      </Flex>

      <OverlappingModal
        isOpen={isOverlapModalOpen}
        onCloseModal={closeModal}
        overlappingEvents={overlappingEvents}
        onSaveOverlapEvent={handleSaveOverlapEvent}
      />
      <LeapDayUnsupportedModal
        isOpen={isLeapMonthModalOpen}
        onCloseModal={setIsLeapMonthModalOpen}
        formData={eventForm}
      />
      <InvalidMonthlyRepeatModal
        isOpen={isInvalidMonthlyRepeatModalOpen}
        onCloseModal={setIsInvalidMonthlyRepeatModalOpen}
      />

      {notifications.length > 0 && (
        <AlertContainer notifications={notifications} removeNotification={removeNotification} />
      )}
    </Box>
  );
}
