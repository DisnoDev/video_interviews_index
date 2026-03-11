import type { InterviewRecord, SortDirection, SortField } from '../types';
import { normalizeText } from './utils';
import {
  getPreferredAuthor,
  getPreferredCollection,
  getPreferredConcept,
  getPreferredTitle,
} from './records';

export function matchesSearch(record: InterviewRecord, query: string): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return tokens.every((token) => record.searchIndex.includes(token));
}

export function filterRecords(records: InterviewRecord[], options: {
  query: string;
  collection: string;
  keyword: string | null;
  author: string | null;
}): InterviewRecord[] {
  const normalizedKeyword = normalizeText(options.keyword || '');
  const normalizedAuthor = normalizeText(options.author || '');

  return records.filter((record) => {
    if (options.collection && record.collection !== options.collection) {
      return false;
    }
    if (!matchesSearch(record, options.query)) {
      return false;
    }
    if (normalizedKeyword && !record.keywords.some((keyword) => normalizeText(keyword) === normalizedKeyword)) {
      return false;
    }
    if (normalizedAuthor && normalizeText(record.author) !== normalizedAuthor) {
      return false;
    }
    return true;
  });
}

export function sortRecords(
  records: InterviewRecord[],
  sortField: SortField,
  sortDirection: SortDirection,
  language: string,
): InterviewRecord[] {
  const multiplier = sortDirection === 'asc' ? 1 : -1;

  return [...records].sort((left, right) => {
    const leftValue = getSortableValue(left, sortField, language);
    const rightValue = getSortableValue(right, sortField, language);

    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    const bothNumeric = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);

    const comparison = bothNumeric
      ? leftNumber - rightNumber
      : String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: 'base' });

    if (comparison !== 0) {
      return comparison * multiplier;
    }

    return getPreferredConcept(left, language).localeCompare(getPreferredConcept(right, language), undefined, { sensitivity: 'base' }) * multiplier;
  });
}

function getSortableValue(record: InterviewRecord, field: SortField, language: string): string | number {
  switch (field) {
    case 'author':
      return getPreferredAuthor(record, language);
    case 'year':
      return record.year || '0';
    case 'duration':
      return record.durationSeconds || 0;
    case 'collection':
      return getPreferredCollection(record, language);
    case 'title':
      return getPreferredTitle(record, language) || getPreferredConcept(record, language);
    case 'concept':
    default:
      return getPreferredConcept(record, language);
  }
}
