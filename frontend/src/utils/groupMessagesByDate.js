import { langAtom } from "@/atoms/langAtom";
import { format, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";
import { useRecoilValue } from "recoil";

export const groupMessagesByDate = (messages) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lang = useRecoilValue(langAtom);
  const groups = {};

  messages.forEach((message) => {
    const date = new Date(message?.createdAt);

    let label = "";
    if (isToday(date) && lang !== 'ar') label = "Today";
    else if(isToday(date) && lang === 'ar') label = "اليوم";
    else if (isYesterday(date) && lang !== 'ar' ) label = "Yesterday";
    else if (isYesterday(date) && lang === 'ar' ) label = "أمس";
    else if(lang === 'ar') label = format(date, "dd MMMM", { locale: ar });
    else label = format(date, "dd MMMM");

    if (!groups[label]) groups[label] = [];
    groups[label].push(message);
  });

  return groups;
};