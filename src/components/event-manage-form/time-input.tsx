import { FormControl, FormLabel, HStack, Input, Tooltip } from '@chakra-ui/react';

import { useEventFormContext } from '@/hooks/contexts';
import { getTimeErrorMessage } from '@/utils/timeValidation';

export const TimeInput = () => {
  const {
    startTime,
    endTime,
    startTimeError,
    endTimeError,
    handleStartTimeChange,
    handleEndTimeChange,
  } = useEventFormContext();

  return (
    <HStack width="100%">
      <FormControl>
        <FormLabel>시작 시간</FormLabel>
        <Tooltip label={startTimeError} isOpen={!!startTimeError} placement="top">
          <Input
            type="time"
            value={startTime}
            onChange={handleStartTimeChange}
            onBlur={() => getTimeErrorMessage(startTime, endTime)}
            isInvalid={!!startTimeError}
          />
        </Tooltip>
      </FormControl>
      <FormControl>
        <FormLabel>종료 시간</FormLabel>
        <Tooltip label={endTimeError} isOpen={!!endTimeError} placement="top">
          <Input
            type="time"
            value={endTime}
            onChange={handleEndTimeChange}
            onBlur={() => getTimeErrorMessage(startTime, endTime)}
            isInvalid={!!endTimeError}
          />
        </Tooltip>
      </FormControl>
    </HStack>
  );
};
