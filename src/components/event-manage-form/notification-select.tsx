import { FormControl, FormLabel, Select } from '@chakra-ui/react';

import { NOTIFICATION_OPTIONS } from '@/config/constants';
import { useEventFormContext } from '@/hooks/contexts';

export const NotificationSelect = () => {
  const { notificationTime, setNotificationTime } = useEventFormContext();

  return (
    <FormControl>
      <FormLabel>알림 설정</FormLabel>
      <Select
        value={notificationTime}
        onChange={(e) => setNotificationTime(Number(e.target.value))}
      >
        {NOTIFICATION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};
