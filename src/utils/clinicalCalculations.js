export function extractGenderRangeSegment(rangeText, gender) {
  if (!rangeText) return '';
  const text = String(rangeText);
  const hasMale = /\bM\s*:/i.test(text);
  const hasFemale = /\bF\s*:/i.test(text);
  if (!hasMale || !hasFemale) return text;

  const parts = text.split(/\||\n/).map((part) => part.trim());
  const male = parts.find((part) => /^M\s*:/i.test(part));
  const female = parts.find((part) => /^F\s*:/i.test(part));
  const chosen = gender === 'F' ? female : male;
  return (chosen || text).replace(/^[MF]\s*:\s*/i, '');
}

export function parseNumericBounds(rangeText) {
  if (!rangeText) return null;
  const text = String(rangeText).trim();

  let match = text.match(/(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (match) return { low: parseFloat(match[1]), high: parseFloat(match[2]) };

  match = text.match(/(?:<=|≤|up\s*to)\s*(-?\d+(?:\.\d+)?)/i);
  if (match) return { low: -Infinity, high: parseFloat(match[1]) };

  match = text.match(/^<\s*(-?\d+(?:\.\d+)?)/);
  if (match) return { low: -Infinity, high: parseFloat(match[1]) };

  match = text.match(/(?:>=|≥)\s*(-?\d+(?:\.\d+)?)/);
  if (match) return { low: parseFloat(match[1]), high: Infinity };

  match = text.match(/^>\s*(-?\d+(?:\.\d+)?)/);
  if (match) return { low: parseFloat(match[1]), high: Infinity };

  return null;
}

export function parseNumericValue(value) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/,/g, '').trim();
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  return parseFloat(match[0]);
}

export function isAbnormalResult(test, gender) {
  if (!test || !test.value) return false;

  const rangeSegment = extractGenderRangeSegment(test.referenceRange, gender);
  const bounds = parseNumericBounds(rangeSegment);
  const numericValue = parseNumericValue(test.value);
  if (bounds && numericValue !== null) {
    return numericValue < bounds.low || numericValue > bounds.high;
  }

  if (Array.isArray(test.abnormalOptions) && test.abnormalOptions.length) {
    return test.abnormalOptions.some((option) => option.trim().toLowerCase() === String(test.value).trim().toLowerCase());
  }

  return false;
}

export function isCriticalResult(test, gender) {
  if (!test || !test.value) return false;

  const hasCriticalLow = test.criticalLow !== undefined && test.criticalLow !== null && test.criticalLow !== '';
  const hasCriticalHigh = test.criticalHigh !== undefined && test.criticalHigh !== null && test.criticalHigh !== '';
  if (hasCriticalLow || hasCriticalHigh) {
    const numericValue = parseNumericValue(test.value);
    if (numericValue === null) return false;
    if (hasCriticalLow && numericValue < parseFloat(test.criticalLow)) return true;
    if (hasCriticalHigh && numericValue > parseFloat(test.criticalHigh)) return true;
    return false;
  }

  if (Array.isArray(test.criticalOptions) && test.criticalOptions.length) {
    return test.criticalOptions.some((option) => option.trim().toLowerCase() === String(test.value).trim().toLowerCase());
  }

  return false;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function evaluateFormula(formula, component) {
  if (!formula || !component || !Array.isArray(component.tests)) return '';

  const rawFormula = String(formula).trim();
  if (!rawFormula) return '';

  let missing = false;
  const siblingTests = component.tests;

  // Helper to find a matching sibling test by token / name / id
  const findSibling = (identifier) => {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    return siblingTests.find((item) => {
      const itemId = (item.id || '').trim().toLowerCase();
      const itemName = (item.name || '').trim().toLowerCase();
      return itemId === clean || itemName === clean;
    });
  };

  // Step 1: Replace explicit braced or bracketed tokens: {Total Cholesterol}, [Triglycerides], {triglycerides}
  let expr = rawFormula.replace(/\{([^}]+)\}|\[([^\]]+)\]/g, (match, p1, p2) => {
    const token = (p1 || p2 || '').trim();
    const sibling = findSibling(token);
    if (!sibling) {
      missing = true;
      return '0';
    }
    const num = parseNumericValue(sibling.value);
    if (num === null) {
      missing = true;
      return '0';
    }
    return `(${num})`;
  });

  // Step 2: For any remaining unbraced test names or IDs, match candidates in descending order of length
  const candidates = [];
  siblingTests.forEach((item) => {
    if (item.name && item.name.trim().length >= 2) {
      candidates.push({ key: item.name.trim(), test: item });
    }
    if (item.id && item.id.trim().length >= 2) {
      candidates.push({ key: item.id.trim(), test: item });
    }
  });

  // Deduplicate and sort by length descending so longer test names match first
  const uniqueCandidates = [];
  const seenKeys = new Set();
  candidates.sort((a, b) => b.key.length - a.key.length);
  for (const c of candidates) {
    const lower = c.key.toLowerCase();
    if (!seenKeys.has(lower)) {
      seenKeys.add(lower);
      uniqueCandidates.push(c);
    }
  }

  for (const { key, test } of uniqueCandidates) {
    const escapedKey = escapeRegExp(key);
    const regex = new RegExp(escapedKey, 'gi');
    if (regex.test(expr)) {
      const num = parseNumericValue(test.value);
      if (num === null) {
        missing = true;
      }
      const valStr = num !== null ? `(${num})` : '0';
      expr = expr.replace(regex, valStr);
    }
  }

  // If any referenced variable has no value entered yet, return empty
  if (missing) return '';

  // Step 3: Expression must only contain safe arithmetic characters
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return '';

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result !== 'number' || !isFinite(result)) return '';
    return String(Math.round(result * 100) / 100);
  } catch (err) {
    return '';
  }
}

export function recalculateComponentFormulas(component) {
  if (!component || !Array.isArray(component.tests)) return component;
  let updatedComponent = { ...component, tests: component.tests.map((test) => ({ ...test })) };

  // Multiple passes allow formulas to depend on other calculated tests regardless of their row order.
  for (let pass = 0; pass < updatedComponent.tests.length; pass += 1) {
    let changed = false;
    const nextTests = updatedComponent.tests.map((test) => {
      if (!test.formula) return test;
      const value = evaluateFormula(test.formula, updatedComponent);
      if (value !== test.value) changed = true;
      return { ...test, value };
    });
    updatedComponent = { ...updatedComponent, tests: nextTests };
    if (!changed) break;
  }

  return updatedComponent;
}
