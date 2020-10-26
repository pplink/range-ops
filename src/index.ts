import { chain } from "lodash";

export interface Range {
  start: number;
  end: number;
}

const crossSorted = (firstRanges: Range[], secondRanges: Range[]): Range[] => {
  const [firstRange, ...firstRangesLeft] = firstRanges;
  const [secondRange, ...secondRangesLeft] = secondRanges;
  if (!firstRange || !secondRange) return [];
  // { start: S1, end: E1 }
  const earlierRange =
    firstRange.start > secondRange.start ? secondRange : firstRange;
  // { start: S2, end: E2 }
  const laterRange =
    firstRange.start > secondRange.start ? firstRange : secondRange;
  const earlierRangesLeft =
    earlierRange === firstRange ? firstRangesLeft : secondRangesLeft;
  const laterRangesLeft =
    laterRange === firstRange ? firstRangesLeft : secondRangesLeft;

  // Case 1: S1 - E1 - S2 - E2 -> No overlap
  if (earlierRange.end < laterRange.start) {
    return crossSorted(earlierRangesLeft, [laterRange, ...laterRangesLeft]);
  }
  // Case 2: S1 - S2 - E2 - E1 -> laterRange is contained
  if (laterRange.end < earlierRange.end) {
    return [
      laterRange,
      ...crossSorted(
        [
          { start: laterRange.end, end: earlierRange.end },
          ...earlierRangesLeft,
        ],
        laterRangesLeft
      ),
    ];
  }
  // Case 3: S1 - S2 - E1 - E2 -> Range is splitted
  return [
    { start: laterRange.start, end: earlierRange.end },
    ...crossSorted(earlierRangesLeft, [
      { start: earlierRange.end, end: laterRange.end },
      ...laterRangesLeft,
    ]),
  ];
};

const sort = (ranges: Range[]) =>
  chain(ranges)
    .sortBy((r) => r.end)
    .sortBy((r) => r.start)
    .value();

const mergeSorted = (ranges: Range[]): Range[] => {
  const [earlierRange, ...restRanges] = ranges;
  if (!earlierRange) return [];
  const overlappingLaterRange = restRanges.find((laterRange) => {
    if (earlierRange.end < laterRange.start) return false;
    return true;
  });
  if (!overlappingLaterRange) {
    return [earlierRange, ...mergeSorted(restRanges)];
  }
  if (overlappingLaterRange.end < earlierRange.end) {
    return mergeSorted(ranges.filter((r) => r !== overlappingLaterRange));
  }
  return mergeSorted([
    { start: earlierRange.start, end: overlappingLaterRange.end },
    ...restRanges.filter((r) => r !== overlappingLaterRange),
  ]);
};

export const merge = (ranges: Range[]) => {
  const sortedRanges = sort(ranges);
  return mergeSorted(sortedRanges);
};

// In an array of ranges, there should be no overlaps and it should be ordered
export const cross = (firstRanges: Range[], secondRanges: Range[]): Range[] => {
  const sortedFirstRanges = merge(firstRanges);
  const sortedSecondRanges = merge(secondRanges);
  const rawResult = crossSorted(sortedFirstRanges, sortedSecondRanges);
  return merge(rawResult);
};
