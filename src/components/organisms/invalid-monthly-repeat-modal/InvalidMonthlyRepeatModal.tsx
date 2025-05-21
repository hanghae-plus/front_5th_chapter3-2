import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import React, { useRef } from 'react';

interface InvalidMonthlyRepeatModalProps {
  isOpen: boolean;
  onCloseModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const InvalidMonthlyRepeatModal = ({
  isOpen,
  onCloseModal,
}: InvalidMonthlyRepeatModalProps) => {
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
            31일 반복 일정 경고
          </AlertDialogHeader>

          <AlertDialogBody>
            매달 31일은 모든 달에 존재하지 않아 반복 등록이 불가능합니다.
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
