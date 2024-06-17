import dayjs from "dayjs";

export function showTimeLeft(endDate: string | number) {
  let endDateDjs = dayjs(endDate);

  const diffInDays = endDateDjs.diff(undefined, "days");

  if (diffInDays < 80) {
    return diffInDays + " days left";
  }

  const diffInMonths = endDateDjs.diff(undefined, "months");

  return diffInMonths + "  months left";
}
