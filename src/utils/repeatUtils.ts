const TEST_END_DATE = '2025-06-30';

export const getRepeatDates = (
  today: Date,
  repeatOptions: { type: string; interval: number; endDate?: Date }
) => {
  console.log('Date', today);
  console.log('repeatOptions', repeatOptions);
  return [];
};
