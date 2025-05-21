import { Heading, VStack } from '@chakra-ui/react';

import {
  AddScheduleForm,
  AddScheduleFormProps,
} from '@/components/organisms/schedule/add-schedule-form';

export const AddScheduleTemplate = ({
  addOrUpdateEvent,
  handleOnChangeEvent,
  eventForm,
  isEditEvent,
  startTimeError,
  endTimeError,
  isRepeating,
  setIsRepeating,
}: AddScheduleFormProps) => {
  return (
    <VStack w="400px" spacing={5} align="stretch">
      <Heading>{isEditEvent ? '일정 수정' : '일정 추가'}</Heading>

      <AddScheduleForm
        addOrUpdateEvent={addOrUpdateEvent}
        eventForm={eventForm}
        handleOnChangeEvent={handleOnChangeEvent}
        isEditEvent={isEditEvent}
        isRepeating={isRepeating}
        setIsRepeating={setIsRepeating}
        startTimeError={startTimeError}
        endTimeError={endTimeError}
      />
    </VStack>
  );
};
