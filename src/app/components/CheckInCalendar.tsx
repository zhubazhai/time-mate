import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AttendanceStatus,
  getStatusClass,
  getStatusIcon,
  getStatusText,
  toggleStatus,
  isWeekday,
  cn,
} from "@/app/lib/utils";
import dayjs from "dayjs";

interface CheckInCalendarProps {
  attendanceData: Array<{
    date: string;
    status: AttendanceStatus;
    day: number;
  }>;
  onDateClick?: (date: Date, status: AttendanceStatus) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export function CheckInCalendar({
  attendanceData,
  onDateClick,
  currentMonth,
  setCurrentMonth,
}: CheckInCalendarProps) {
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);

  // 生成当月的所有日期
  useEffect(() => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 获取当月第一天
    const firstDay = new Date(year, month, 1);
    // 获取当月最后一天
    const lastDay = new Date(year, month + 1, 0);

    // 添加当月的所有日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    setDaysInMonth(days);
  }, [currentMonth]);

  // 切换到上一个月
  const prevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  // 切换到下一个月
  const nextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  // 获取某天的考勤状态
  const getStatus = (date: Date): AttendanceStatus => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const entry = attendanceData.find((item) => item.date === dateStr);
    return entry?.status || "absent";
  };

  // 检查是否是今天
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 处理日期点击
  const handleDateClick = (date: Date) => {
    console.log(date, "date");
    if (onDateClick) {
      const currentStatus = getStatus(date);
      const newStatus = toggleStatus(currentStatus, date);
      onDateClick(date, newStatus);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
        签到日历
      </h2>

      {/* 月份导航 */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="上一个月"
        >
          <i className="fa-solid fa-chevron-left">上一个月</i>
        </button>

        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          {currentMonth.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
          })}
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="下一个月"
        >
          <i className="fa-solid fa-chevron-right">下一个月</i>
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <div
            key={day}
            className="text-center text-sm text-gray-500 dark:text-gray-400 py-2 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-2">
        {/* 填充月初前的空白 */}
        {Array.from({
          length: new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
          ).getDay(),
        }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16"></div>
        ))}

        {/* 当月日期 */}
        {daysInMonth.map((date, index) => {
          const status = getStatus(date);
          const today = isToday(date);

          const isWorkday = isWeekday(date);

          return (
            <motion.div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`relative flex flex-col items-center justify-center rounded-lg h-16 transition-all cursor-pointer ${
                today ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""
              } ${
                // 未来日期不可点击
                date > new Date(new Date().setHours(0, 0, 0, 0))
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-md"
              }`}
              whileHover={
                date <= new Date(new Date().setHours(0, 0, 0, 0))
                  ? { scale: 1.05 }
                  : undefined
              }
            >
              <div
                className={`w-full h-full flex flex-col items-center justify-center rounded-lg ${getStatusClass(
                  status
                )}`}
              >
                <span
                  className={`text-sm font-medium ${
                    today ? "text-blue-600 dark:text-blue-400 font-bold" : ""
                  }`}
                >
                  {date.getDate()}
                </span>

                {status !== "absent" && (
                  <motion.div
                    className="mt-1 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <i
                      className={`fa-solid ${getStatusIcon(status)} text-xs`}
                      title={getStatusText(status)}
                    ></i>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap justify-center items-center mt-6 text-sm gap-x-6 gap-y-2">
        {[
          { label: "全勤", color: "green" },
          { label: "半天", color: "yellow" },
          { label: "加班", color: "blue" },
          { label: "缺勤", color: "gray" },
        ].map((item, index) => {
          return (
            <div key={item.color} className="flex items-center">
              <div
                className={cn([
                  "w-3",
                  "h-3",
                  "rounded-full",
                  `bg-${item.color}-100`,
                  "border",
                  `border-${item.color}-500`,
                  "mr-2",
                ])}
              ></div>
              <span className="text-gray-600 dark:text-gray-300">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
