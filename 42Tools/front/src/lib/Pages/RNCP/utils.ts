import dayjs from "dayjs";

export function showTimeLeft(endDate?: string | number) {

  if (endDate == null) {
    return "--"
  };

  let endDateDjs = dayjs(endDate);

  const diffInDays = endDateDjs.diff(undefined, "days");

  if (diffInDays < 80) {
    return diffInDays + " days left";
  }

  const diffInMonths = endDateDjs.diff(undefined, "months");

  return diffInMonths + "  months left";
}

export function formatDateDisplay(date?: string | Date | number) {
  if (date === null) {
    return "--"
  }

  return dayjs(date).format("DD/MM/YYYY")
}