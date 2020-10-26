import { chain } from "lodash";

export interface Range {
  start: number;
  end: number;
}

const intersectSorted = (
  firstRanges: Range[],
  secondRanges: Range[]
): Range[] => {
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
    return intersectSorted(earlierRangesLeft, [laterRange, ...laterRangesLeft]);
  }
  // Case 2: S1 - S2 - E2 - E1 -> laterRange is contained
  if (laterRange.end < earlierRange.end) {
    return [
      laterRange,
      ...intersectSorted(
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
    ...intersectSorted(earlierRangesLeft, [
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

const unionSorted = (ranges: Range[]): Range[] => {
  const [earlierRange, ...restRanges] = ranges;
  if (!earlierRange) return [];
  const overlappingLaterRange = restRanges.find((laterRange) => {
    if (earlierRange.end < laterRange.start) return false;
    return true;
  });
  if (!overlappingLaterRange) {
    return [earlierRange, ...unionSorted(restRanges)];
  }
  if (overlappingLaterRange.end < earlierRange.end) {
    return unionSorted(ranges.filter((r) => r !== overlappingLaterRange));
  }
  return unionSorted([
    { start: earlierRange.start, end: overlappingLaterRange.end },
    ...restRanges.filter((r) => r !== overlappingLaterRange),
  ]);
};

export const union = (ranges: Range[]) => {
  const sortedRanges = sort(ranges);
  return unionSorted(sortedRanges);
};

// In an array of ranges, there should be no overlaps and it should be ordered
export const intersect = (
  firstRanges: Range[],
  secondRanges: Range[]
): Range[] => {
  const sortedFirstRanges = union(firstRanges);
  const sortedSecondRanges = union(secondRanges);
  const rawResult = intersectSorted(sortedFirstRanges, sortedSecondRanges);
  return union(rawResult);
};
