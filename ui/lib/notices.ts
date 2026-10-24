export interface NoticePort {
  error: (message: string) => void;
  info: (message: string) => void;
}
