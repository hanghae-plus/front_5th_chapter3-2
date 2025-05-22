import { Box, Flex } from '@chakra-ui/react';

import { Calendar } from '@/components/calendar';
import { AlertEventDialog } from '@/components/event-alert-dialog';
import { EventList } from '@/components/event-list';
import { EventManageForm } from '@/components/event-manage-form';
import { Notifications } from '@/components/notifications';

const App = () => {
  return (
    <Box w="full" h="100vh" m="auto" p={5}>
      <Flex gap={6} h="full">
        <EventManageForm />
        <Calendar />
        <EventList />
      </Flex>

      <AlertEventDialog />
      <Notifications />
    </Box>
  );
};

export default App;
