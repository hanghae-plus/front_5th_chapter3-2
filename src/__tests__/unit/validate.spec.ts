import { isNumberInRange } from '../../utils/validate';

describe('isNumberInRange', () => {
  it('정상 범위 내 숫자는 true를 반환한다', () => {
    expect(isNumberInRange({ value: 5, min: 1, max: 10 })).toBe(true);
    expect(isNumberInRange({ value: 1, min: 1, max: 10 })).toBe(true);
    expect(isNumberInRange({ value: 10, min: 1, max: 10 })).toBe(true);
  });

  it('범위 밖의 숫자는 false를 반환한다', () => {
    expect(isNumberInRange({ value: 0, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: 11, min: 1, max: 10 })).toBe(false);
  });

  it('min, max가 지정되지 않은 경우 Infinity를 기본값으로 사용한다', () => {
    expect(isNumberInRange({ value: 999 })).toBe(true);
    expect(isNumberInRange({ value: -999 })).toBe(true);
  });

  it('NaN, Infinity, 문자, null, undefined 등 숫자가 아닌 값에는 false를 반환한다', () => {
    expect(isNumberInRange({ value: NaN, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: Infinity, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: -Infinity, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: '0005' as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: null as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: undefined as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: {} as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: [] as any, min: 1, max: 10 })).toBe(false);
  });
});
