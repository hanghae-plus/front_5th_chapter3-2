import { RepeatType } from '../types';

interface Props {
  type: RepeatType;
  size?: number;
}

export const RepeatIcon = ({ type, size = 14 }: Props) => {
  if (type === 'none') return null;

  return (
    <img
      src="/icons/repeat.png"
      alt="반복 일정 아이콘"
      title={`반복 일정 (${type})`}
      width={size}
      height={size}
      className="ml-1 inline-block opacity-70"
    />
  );
};
