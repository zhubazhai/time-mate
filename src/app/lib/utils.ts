import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import Holidays from "date-holidays";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 考勤状态类型
export type AttendanceStatus = "full" | "half" | "overtime" | "absent";

// 判断日期是否为工作日（周一至周五）
export function isWeekday(date: string): boolean {
  const hd = new Holidays();
  const formattedDate = dayjs(date).format("YYYY-MM-DD");
  const dayOfWeek = dayjs(date).day();
  const isHoliday = hd.isHoliday(formattedDate, "CN"); // 检查是否是中国的节假日

  console.log("2025-10-01", "CN", hd.isHoliday("2025-10-01", "CN"));
  return dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday;
}

// 获取日期的默认考勤状态
export function getDefaultStatus(date: string): AttendanceStatus {
  // 如果是工作日，默认全勤；周末默认缺勤
  return isWeekday(date) ? "full" : "absent";
}

// 根据考勤状态获取显示样式类
export function getStatusClass(status: AttendanceStatus): string {
  switch (status) {
    case "full":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "half":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "overtime":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "absent":
    default:
      return "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
  }
}

// 根据考勤状态获取显示文本
export function getStatusText(status: AttendanceStatus): string {
  switch (status) {
    case "full":
      return "全勤";
    case "half":
      return "半天";
    case "overtime":
      return "加班";
    case "absent":
      return "缺勤";
    default:
      return "未设置";
  }
}

// 根据考勤状态获取图标
export function getStatusIcon(status: AttendanceStatus): string {
  switch (status) {
    case "full":
      return "fa-check";
    case "half":
      return "fa-clock";
    case "overtime":
      return "fa-bolt";
    case "absent":
      return "fa-times";
    default:
      return "fa-question";
  }
}

// 切换考勤状态（根据当前状态和日期类型）
export function toggleStatus(
  currentStatus: AttendanceStatus,
  date: Date
): AttendanceStatus {
  const isWorkday = isWeekday(date);

  // 工作日状态循环: full → half → absent → full
  if (isWorkday) {
    switch (currentStatus) {
      case "full":
        return "half";
      case "half":
        return "absent";
      case "absent":
      default:
        return "full";
    }
  }
  // 周末状态循环: absent → overtime → absent
  else {
    switch (currentStatus) {
      case "overtime":
        return "absent";
      case "absent":
      default:
        return "overtime";
    }
  }
}
