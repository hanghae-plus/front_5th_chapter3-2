import { RepeatIcon } from '@chakra-ui/icons';
import { Text } from '@chakra-ui/react';
import { ReactElement } from 'react';

import { RepeatType } from '../types';

// 반복 유형에 따른 텍스트 포맷팅 함수
export const formatRepeatTypeText = (type: RepeatType, interval: number): string => {
  switch (type) {
    case 'daily':
      return `${interval}일마다`;
    case 'weekly':
      return `${interval}주마다`;
    case 'monthly':
      return `${interval}개월마다`;
    case 'yearly':
      return `${interval}년마다`;
    default:
      return '';
  }
};

// 반복 아이콘 컴포넌트
export const RepeatEventIndicator = ({
  type,
  interval,
  endDate,
}: {
  type: RepeatType;
  interval: number;
  endDate?: string;
}): ReactElement | null => {
  if (type === 'none') return null;

  return (
    <Text
      fontSize="sm"
      color="blue.600"
      display="flex"
      alignItems="center"
      data-testid="repeat-indicator"
    >
      <RepeatIcon mr={1} data-testid="repeat-icon" />
      반복: {formatRepeatTypeText(type, interval)}
      {endDate && ` (종료: ${endDate})`}
    </Text>
  );
};
