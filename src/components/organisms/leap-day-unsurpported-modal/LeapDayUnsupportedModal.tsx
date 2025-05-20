import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Text,
} from '@chakra-ui/react';
import React, { useRef } from 'react';

import { EventForm } from '@/types';

interface LeapDayUnsupportedModalProps {
  isOpen: boolean;
  onCloseModal: React.Dispatch<React.SetStateAction<boolean>>;
  formData: EventForm;
}

export const LeapDayUnsupportedModal = ({
  isOpen,
  onCloseModal,
  formData,
}: LeapDayUnsupportedModalProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={() => onCloseModal(false)}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            윤달 반복 경고
          </AlertDialogHeader>

          <AlertDialogBody>
            다음 일정은 윤달이기 때문에 반복불가능합니다.
            <Text>
              {formData.title} ({formData.date} {formData.startTime}-{formData.endTime})
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => onCloseModal(false)}>
              확인
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
