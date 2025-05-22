/**
 * 주어진 숫자가 지정된 범위(포함)에 있는지 확인합니다.
 *
 * @param value - 검사할 숫자입니다.
 * @param min - 허용되는 최소값(포함)입니다. 기본값은 -Infinity입니다.
 * @param max - 허용되는 최대값(포함)입니다. 기본값은 Infinity입니다.
 * @returns 값이 유한한 숫자이고 범위 내에 있으면 `true`, 그렇지 않으면 `false`를 반환합니다.
 */
export function isNumberInRange({
  value,
  min = -Infinity,
  max = Infinity,
}: {
  value: number;
  min?: number;
  max?: number;
}): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;

  if (value < min || value > max) return false;

  return true;
}
