import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useToast,
  VStack,
} from '@chakra-ui/react';

import { CategorySelect } from '@/components/event-manage-form/category-select';
import { NotificationSelect } from '@/components/event-manage-form/notification-select';
import { RepeatSelectInput } from '@/components/event-manage-form/repeat-select-input';
import { TimeInput } from '@/components/event-manage-form/time-input';
import { useDialogContext, useEventFormContext, useEventOperationsContext } from '@/hooks/contexts';
import { Event, EventForm } from '@/types';
import { findOverlappingEvents } from '@/utils/eventOverlap';

export const EventManageForm = () => {
  const {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    endTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    notificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    resetForm,
  } = useEventFormContext();

  const { events, saveEvent, saveRepeatEvent } = useEventOperationsContext();
  const { setIsOverlapDialogOpen, setOverlappingEvents } = useDialogContext();

  const toast = useToast();

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
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

    const eventData: Event | EventForm = {
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
    };

    // 단일 수정으로 진행 시에 반복 제거
    if (editingEvent) eventData.repeat = { type: 'none', interval: 0 };

    const overlapping = findOverlappingEvents(eventData, events);
    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
    } else {
      // 단일 생성으로 일단 구현
      if (isRepeating && repeatType !== 'none') {
        await saveRepeatEvent(eventData);
      } else {
        await saveEvent(eventData);
      }
      resetForm();
    }
  };

  return (
    <VStack w="400px" spacing={5} align="stretch">
      <Heading>{editingEvent ? '일정 수정' : '일정 추가'}</Heading>

      <FormControl>
        <FormLabel>제목</FormLabel>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormControl>

      <FormControl>
        <FormLabel>날짜</FormLabel>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormControl>

      <TimeInput />

      <FormControl>
        <FormLabel>설명</FormLabel>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormControl>

      <FormControl>
        <FormLabel>위치</FormLabel>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </FormControl>

      <CategorySelect />

      <FormControl>
        <FormLabel>반복 설정</FormLabel>
        <Checkbox
          isChecked={isRepeating}
          onChange={(e) => {
            setIsRepeating(e.target.checked);
            setRepeatType(e.target.checked ? 'daily' : 'none');
            setRepeatInterval(e.target.checked ? 1 : 0);
          }}
        >
          반복 일정
        </Checkbox>
      </FormControl>

      <NotificationSelect />

      {isRepeating && <RepeatSelectInput />}

      <Button data-testid="event-submit-button" onClick={addOrUpdateEvent} colorScheme="blue">
        {editingEvent ? '일정 수정' : '일정 추가'}
      </Button>
    </VStack>
  );
};
