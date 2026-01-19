import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatRelative(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function formatDate(date: string | Date, format = "MMM D, YYYY"): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format("MMM D, YYYY h:mm A");
}
