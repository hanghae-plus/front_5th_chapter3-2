import { FormControl, FormLabel, Select } from '@chakra-ui/react';

import { RepeatType } from '../../../types';

interface EventRepeatSelectProps {
  repeatType: RepeatType;
  // eslint-disable-next-line no-unused-vars
  setRepeatType: (repeatType: RepeatType) => void;
}

const EventRepeatSelect = ({ repeatType, setRepeatType }: EventRepeatSelectProps) => {
  return (
    <FormControl>
      <FormLabel>반복 유형</FormLabel>
      <Select value={repeatType} onChange={(e) => setRepeatType(e.target.value as RepeatType)}>
        <option value="daily">매일</option>
        <option value="weekly">매주</option>
        <option value="monthly">매월</option>
        <option value="yearly">매년</option>
      </Select>
    </FormControl>
  );
};

export default EventRepeatSelect;
