import { FormControl, FormLabel, Select } from '@chakra-ui/react';

import { RepeatEndType } from '../types';

interface EventRepeatEndSelectProps {
  repeatEndType: RepeatEndType;
  // eslint-disable-next-line no-unused-vars
  setRepeatEndType: (repeatEndType: RepeatEndType) => void;
}

const EventRepeatEndSelect = ({ repeatEndType, setRepeatEndType }: EventRepeatEndSelectProps) => {
  return (
    <FormControl>
      <FormLabel>반복 종료</FormLabel>
      <Select
        value={repeatEndType}
        onChange={(e) => setRepeatEndType(e.target.value as RepeatEndType)}
      >
        <option value="endDate">종료일</option>
        <option value="endCount">종료 횟수</option>
      </Select>
    </FormControl>
  );
};

export default EventRepeatEndSelect;
