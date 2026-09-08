/**
 * Medical Lab Report Pagination Utility
 *
 * Chunks test groups and individual tests into discrete physical pages (A4, Letter, Legal, A5)
 * keeping entire test groups intact whenever possible. If a test group fits in the remaining space,
 * it stays on the page; otherwise, the whole test group moves cleanly to the next page.
 */

export function getPageCapacities(format = 'a4', letterheadSpacing = 0, footerSpacing = 0) {
  const base = {
    a4: { capacity: 13 },
    letter: { capacity: 11 },
    legal: { capacity: 18 },
    a5: { capacity: 6 }
  }[format] || { capacity: 13 };

  const extraLetterheadUnits = Math.max(0, Math.round((letterheadSpacing - 42) / 35));
  const extraFooterUnits = Math.max(0, Math.round(footerSpacing / 35));

  const safeCapacity = Math.max(4, base.capacity - extraLetterheadUnits - extraFooterUnits);

  return {
    intermediateCapacity: safeCapacity,
    lastPageCapacity: safeCapacity
  };
}

export function paginateTestGroups(
  testGroups = [],
  { pageFormat = 'a4', letterheadSpacing = 0, footerSpacing = 0, density = 'auto' } = {}
) {
  if (!testGroups || testGroups.length === 0) {
    return [{ pageNumber: 1, totalPages: 1, groups: [] }];
  }

  const { intermediateCapacity: defaultIntermediate, lastPageCapacity: defaultLast } = getPageCapacities(
    pageFormat,
    letterheadSpacing,
    footerSpacing
  );

  let densityMultiplier = 1.0;
  if (density === 'compact') densityMultiplier = 1.25;
  if (density === 'spacious') densityMultiplier = 0.8;

  const intermediateCapacity = Math.max(5, Math.round(defaultIntermediate * densityMultiplier));
  const lastPageCapacity = Math.max(3, Math.round(defaultLast * densityMultiplier));

  const getItemWeight = (test) => {
    if (!test) return 1.0;
    if (!test.referenceRange) return 1.0;
    const lines = String(test.referenceRange).split(/\r?\n|\|/).filter((s) => s.trim().length > 0).length;
    if (lines <= 1) return 1.0;
    if (lines === 2) return 1.35;
    if (lines === 3) return 1.7;
    if (lines === 4) return 2.0;
    return Math.min(2.8, 1.0 + (lines - 1) * 0.4);
  };

  const HEADER_WEIGHT = 1.1;
  const SUBHEADER_WEIGHT = 0.75;

  const getGroupWeight = (group) => {
    let w = HEADER_WEIGHT + (group.subheading ? SUBHEADER_WEIGHT : 0);
    for (const t of group.tests || []) {
      w += getItemWeight(t);
    }
    return w;
  };

  // Check if all test groups fit on a single page
  let totalSinglePageWeight = 0;
  for (const group of testGroups) {
    totalSinglePageWeight += getGroupWeight(group);
  }

  if (totalSinglePageWeight <= lastPageCapacity) {
    return [{ pageNumber: 1, totalPages: 1, groups: testGroups }];
  }

  // Multi-page distribution keeping groups intact
  const pages = [];
  let currentPageGroups = [];
  let currentPageWeight = 0;

  const pushCurrentPage = () => {
    if (currentPageGroups.length > 0) {
      pages.push({
        pageNumber: pages.length + 1,
        groups: currentPageGroups
      });
      currentPageGroups = [];
      currentPageWeight = 0;
    }
  };

  for (let gIndex = 0; gIndex < testGroups.length; gIndex++) {
    const group = testGroups[gIndex];
    const groupWeight = getGroupWeight(group);

    // If current page is empty
    if (currentPageWeight === 0) {
      // If group fits on fresh page as a whole
      if (groupWeight <= intermediateCapacity) {
        currentPageGroups.push(group);
        currentPageWeight += groupWeight;
      } else {
        // Group itself is too big for a single page -> split its individual tests
        let activeTests = [];
        let curW = HEADER_WEIGHT + (group.subheading ? SUBHEADER_WEIGHT : 0);
        let activeHeader = { ...group, isContinuation: false };

        for (const t of group.tests || []) {
          const tw = getItemWeight(t);
          if (curW + tw > intermediateCapacity && activeTests.length > 0) {
            currentPageGroups.push({ ...activeHeader, tests: activeTests });
            currentPageWeight = curW;
            pushCurrentPage();

            activeTests = [];
            activeHeader = { ...group, name: `${group.name} (Cont.)`, isContinuation: true };
            curW = HEADER_WEIGHT + (group.subheading ? SUBHEADER_WEIGHT : 0);
          }
          activeTests.push(t);
          curW += tw;
        }

        if (activeTests.length > 0) {
          currentPageGroups.push({ ...activeHeader, tests: activeTests });
          currentPageWeight = curW;
        }
      }
      continue;
    }

    // If current page is not empty:
    // Check if the whole group fits in remaining space of current page
    const available = intermediateCapacity - currentPageWeight;
    if (groupWeight <= available) {
      currentPageGroups.push(group);
      currentPageWeight += groupWeight;
    } else {
      // Does not fit in remaining space -> Move the entire group to next page
      pushCurrentPage();
      gIndex--; // Re-process this group on the new fresh page
    }
  }

  pushCurrentPage();

  return pages.map((p, idx, arr) => ({
    ...p,
    pageNumber: idx + 1,
    totalPages: arr.length
  }));
}
