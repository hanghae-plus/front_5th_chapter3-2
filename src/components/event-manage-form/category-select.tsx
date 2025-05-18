import { FormControl, FormLabel, Select } from '@chakra-ui/react';

import { CATEGORIES } from '@/config/constants';
import { useEventFormContext } from '@/hooks/contexts';

export const CategorySelect = () => {
  const { category, setCategory } = useEventFormContext();

  return (
    <FormControl>
      <FormLabel>카테고리</FormLabel>
      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">카테고리 선택</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};
