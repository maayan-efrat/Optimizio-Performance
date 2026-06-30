export const SCAN_QUEUE = 'scan-queue';

export interface ScanJobData {
  scanId: string;
  projectId: string;
  url: string;
  locale?: 'he' | 'en';
}
