/**
 * Medical Lab Report Pagination Utility
 *
 * Chunks test groups and individual tests into discrete physical pages (A4, Letter, Legal, A5)
 * so that each page cleanly contains letterhead spacing, patient metadata, table column headers,
 * and appropriate page footers with zero print corruption or table overlap.
 */

export function getPageCapacities(format = 'a4', letterheadSpacing = 0, footerSpacing = 0) {
  const base = {
    a4: { intermediate: 18, last: 14 },
    letter: { intermediate: 16, last: 13 },
    legal: { intermediate: 25, last: 21 },
    a5: { intermediate: 10, last: 7 }
  }[format] || { intermediate: 18, last: 14 };

  const extraLetterheadUnits = Math.max(0, Math.round((letterheadSpacing - 42) / 30));
  const extraFooterUnits = Math.max(0, Math.round(footerSpacing / 30));

  return {
    intermediateCapacity: Math.max(6, base.intermediate - extraLetterheadUnits),
    lastPageCapacity: Math.max(4, base.last - extraLetterheadUnits - extraFooterUnits)
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
    const ref = test.referenceRange ? String(test.referenceRange).split(/\r?\n|\|/).length : 1;
    return ref > 2 ? 1.3 : 1.0;
  };

  const HEADER_WEIGHT = 1.2;
  const SUBHEADER_WEIGHT = 0.8;

  // Check if everything fits on a single page
  let totalSinglePageWeight = 0;
  for (const group of testGroups) {
    totalSinglePageWeight += HEADER_WEIGHT;
    if (group.subheading) totalSinglePageWeight += SUBHEADER_WEIGHT;
    for (const t of group.tests || []) {
      totalSinglePageWeight += getItemWeight(t);
    }
  }

  if (totalSinglePageWeight <= lastPageCapacity) {
    return [{ pageNumber: 1, totalPages: 1, groups: testGroups }];
  }

  // Multi-page chunking
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
    const groupTests = group.tests || [];
    const groupHeaderWeight = HEADER_WEIGHT + (group.subheading ? SUBHEADER_WEIGHT : 0);

    let entireGroupWeight = groupHeaderWeight;
    for (const t of groupTests) {
      entireGroupWeight += getItemWeight(t);
    }

    const availableOnCurrent = intermediateCapacity - currentPageWeight;

    // If entire group fits on current page:
    if (currentPageWeight > 0 && entireGroupWeight <= availableOnCurrent) {
      currentPageGroups.push(group);
      currentPageWeight += entireGroupWeight;
      continue;
    }

    // If entire group fits on a fresh page:
    if (currentPageWeight > 0 && entireGroupWeight <= intermediateCapacity) {
      pushCurrentPage();
      currentPageGroups.push(group);
      currentPageWeight = entireGroupWeight;
      continue;
    }

    // Otherwise split group across pages
    const minGroupNeed = groupHeaderWeight + (groupTests.length > 0 ? getItemWeight(groupTests[0]) : 0);
    if (currentPageWeight > 0 && (intermediateCapacity - currentPageWeight) < minGroupNeed) {
      pushCurrentPage();
    }

    let activeGroupHeader = { ...group, isContinuation: false };
    let activeTests = [];
    currentPageWeight += groupHeaderWeight;

    for (let tIndex = 0; tIndex < groupTests.length; tIndex++) {
      const test = groupTests[tIndex];
      const tWeight = getItemWeight(test);

      if (currentPageWeight + tWeight > intermediateCapacity && activeTests.length > 0) {
        currentPageGroups.push({
          ...activeGroupHeader,
          tests: activeTests
        });
        activeTests = [];
        pushCurrentPage();

        activeGroupHeader = { ...group, name: `${group.name} (Cont.)`, isContinuation: true };
        currentPageWeight = groupHeaderWeight;
      }

      activeTests.push(test);
      currentPageWeight += tWeight;
    }

    if (activeTests.length > 0) {
      currentPageGroups.push({
        ...activeGroupHeader,
        tests: activeTests
      });
    }
  }

  pushCurrentPage();

  return pages.map((p, idx, arr) => ({
    ...p,
    pageNumber: idx + 1,
    totalPages: arr.length
  }));
}
