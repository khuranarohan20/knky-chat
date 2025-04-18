import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "~/lib/utils";

export default function DateFormatter({
  dateString,
  formatType = "dd/MM/yy hh:mm",
  isMessage = true,
  className,
}: {
  dateString: string;
  formatType?: string;
  isMessage?: boolean;
  className?: string;
}) {
  const date = parseISO(dateString);

  if (!isMessage && isYesterday(date)) {
    return (
      <time dateTime={dateString} className={cn(className)}>
        Yesterday
      </time>
    );
  }

  if (!isMessage && isToday(date)) {
    return (
      <time dateTime={dateString} className={cn(className)}>
        Today
      </time>
    );
  }

  return (
    <div className={cn(className)}>
      <time dateTime={dateString}>{format(date, formatType)}</time>
    </div>
  );
}
