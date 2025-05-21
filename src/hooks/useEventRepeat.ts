interface UseEventRepeatProps {
  isRepeating: boolean;
}

export const useEventRepeat = ({ isRepeating }: UseEventRepeatProps) => {
  if (!isRepeating) return null;
  return {};
};
