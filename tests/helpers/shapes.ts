import type { ArchivedCounts } from '@/src/types';

export interface Identified {
  id: string;
}

export interface ArchiveSummary {
  epic: string;
  archived: ArchivedCounts;
}

export interface SearchResults {
  results: Identified[];
}

export interface Totaled {
  total: number;
}

export interface ContentItem {
  content: string;
}
