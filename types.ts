
export interface ProcessingResult {
  originalText: string;
  rewrittenText: string;
  language: string;
}

export enum ProcessingState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
