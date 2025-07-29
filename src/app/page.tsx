"use client";
import { useState, useEffect } from "react";
import { CheckInCalendar } from "@/app/components/CheckInCalendar";
import { AttendanceStatus, getDefaultStatus } from "@/app/lib/utils";
import { toast } from "sonner";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// 生成指定月份的考勤数据
const generateMockAttendanceData = (month: number) => {
  const data = [];

  // 获取当月的天数
  const currentDate = dayjs(month);
  const firstDayOfMonth = currentDate.startOf("month");
  const lastDayOfMonth = currentDate.endOf("month");
  const daysInMonth = lastDayOfMonth.date();
  const daysArray = [];
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(firstDayOfMonth.add(i - 1, "day").format("YYYY-MM-DD"));
  }

  return daysArray.map((date) => {
    // 设置默认状态：工作日全勤，周末缺勤

    const status = getDefaultStatus(date);
    return {
      date,
      status,
    };
  });
};

// 获取本地存储的月份数据键名
const getMonthStorageKey = (year: number, month: number) => {
  return `attendanceData_${year}_${month}`;
};

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<
    Array<{
      date: string;
      status: AttendanceStatus;
      day: number;
    }>
  >([]);

  // 输入框状态
  const [position, setPosition] = useState("前端开发");
  const [name, setName] = useState("孟令峰");
  const [email, setEmail] = useState("3573294503@qq.com");
  const [isLoading, setIsLoading] = useState(false);

  // 加载指定月份的数据
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const storageKey = getMonthStorageKey(year, month);

    // 尝试从本地存储加载该月份的数据
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAttendanceData(parsedData);
      } catch (error) {
        console.error(
          `Failed to parse saved data for ${year}-${
            month + 1
          }, generating new data`,
          error
        );
        const newData = generateMockAttendanceData(currentMonth);
        setAttendanceData(newData);
        localStorage.setItem(storageKey, JSON.stringify(newData));
      }
    } else {
      // 生成新的模拟数据
      const newData = generateMockAttendanceData(currentMonth);
      setAttendanceData(newData);
      localStorage.setItem(storageKey, JSON.stringify(newData));
    }
  }, [currentMonth]);

  // 处理日期点击，更新考勤状态
  const handleDateClick = (date: Date, newStatus: AttendanceStatus) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");

    // 更新考勤数据
    const updatedData = attendanceData.map((item) =>
      item.date === dateStr ? { ...item, status: newStatus } : item
    );

    // 更新状态和本地存储
    setAttendanceData(updatedData);

    // 保存到对应月份的本地存储键
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const storageKey = getMonthStorageKey(year, month);
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  };

  // 发送邮件处理函数
  const doSendEmail = async () => {
    setIsLoading(true);
    if (!position || !name || !email) {
      toast.error("请填写完整信息");
      setIsLoading(false);
      return;
    }
    const ecxelData = await generateExcel({
      attendanceData,
      currentMonth,
      position,
      name,
      email,
    });

    await sendEmail(ecxelData).finally(() => setIsLoading(false));
  };

  // 导出处理函数
  const handleExport = async () => {
    const { blob, mailName } = await generateExcel({
      attendanceData,
      currentMonth,
      position,
      name,
      email,
    });

    saveAs(blob, mailName);
    toast.success("数据已导出");
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* 新增的输入框和按钮区域 */}
        <div className="p-6 mb-8 bg-white border border-gray-100 shadow-md rounded-xl dark:border-gray-700">
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                岗位
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2 transition-colors border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="请输入岗位"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 transition-colors border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 transition-colors border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="请输入邮箱"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 text-gray-800 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              <i className="mr-2 fa-solid fa-download"></i> 导出
            </button>
            <button
              onClick={doSendEmail}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon
                    icon={faCircleNotch}
                    spin
                    className="mr-2 text-white"
                  />
                  发送中...
                </>
              ) : (
                <>
                  <i className="mr-2 fa-solid fa-paper-plane"></i> 发送邮件
                </>
              )}
            </button>
          </div>
        </div>

        {/* 日历组件 */}
        <CheckInCalendar
          attendanceData={attendanceData}
          onDateClick={handleDateClick}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />
      </div>
    </div>
  );
}
async function sendEmail(data: Object) {
  const { toEmail, subject, text, mailName, blob } = data;
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append("to", toEmail);
  formData.append("subject", subject);
  formData.append("text", text);
  formData.append("file", blob, mailName);
  formData.append("name", mailName);
  try {
    // 发送请求
    const response = await fetch("/api/send-email", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // 如果响应状态码不是 2xx，抛出错误
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 解析响应体（如果需要的话）
    const data = await response.json(); // 或者 response.text() 等，取决于响应内容类型

    return data; // 返回响应数据（如果需要的话）
  } catch (error) {
    throw error; // 可以选择抛出错误，以便调用者可以进一步处理
  }
}
async function generateExcel({
  attendanceData,
  currentMonth,
  position,
  name,
  email,
}) {
  const curMonth = currentMonth;
  // 创建一个新的工作簿
  const workbook = new ExcelJS.Workbook();
  const [err, tplArrayBuffer] = await fetch(
    "https://zhubazhai.github.io/checking-in/attendanceTemplate.xlsx"
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return [null, response.arrayBuffer()]; // 指定返回类型为 ArrayBuffer
    })
    .catch((error) => [error, null]);
  if (err) {
    console.log(err, "err");
    return;
  }

  await workbook.xlsx.load(tplArrayBuffer);
  const worksheet = workbook.worksheets[0]; // 取第一个工作表

  worksheet.getCell("B5").value = position;
  worksheet.getCell("B4").value = dayjs(curMonth).format("MMM-YYYY");
  const monthZh = dayjs(curMonth).format("M月份");
  worksheet.getCell("F4").value = monthZh;
  worksheet.getCell("F5").value = dayjs(curMonth)
    .startOf("month")
    .format("YYYY/M/D");
  worksheet.getCell("F6").value = dayjs(curMonth)
    .endOf("month")
    .format("YYYY/M/D");

  // 修改整行内容
  const monthArray = attendanceData.map((item) => {
    const { status, date } = item;
    const isAbsent = status === "absent";
    const isFull = status === "full";
    const isHalf = status === "half";
    return [
      date,
      !isAbsent ? `${position}与技术支持` : "",
      isFull ? `Y` : "",
      isFull ? "1" : "",
      isHalf ? "1" : "",
      isFull ? `Y` : "",
      isHalf ? "请假半天" : "",
    ];
  });
  worksheet.getCell("D40").value = monthArray.reduce(
    (acc, cur) => acc + Number(cur[3]),
    0
  );
  worksheet.getCell("E40").value = monthArray.reduce(
    (acc, cur) => acc + Number(cur[4]),
    0
  );
  console.log(monthArray, "monthArray");
  //
  worksheet.eachRow((row, rowNum) => {
    if (rowNum >= 9 && rowNum <= 39) {
      row.eachCell((cell, colNumber) => {
        cell.value = monthArray[rowNum - 9][colNumber - 1];
        if (colNumber === 1) {
        }
      });
    }
  });
  const totalDays = monthArray.filter((array) => array[1]).length;
  const blob = new Blob([await workbook.xlsx.writeBuffer()]);

  const mailName = `普菲特工作记录-${name}-${dayjs(curMonth).format(
    "YYYY年MM月"
  )}-${totalDays}天.xlsx`;
  return {
    blob,
    mailName,
    subject: `TCL-IT技术服务2024-2026人力`,
    toEmail: email,
    text: `
外包项目-${name}顾问-${monthZh}-${totalDays}天
您好：     
麻烦确认一下本人${monthZh}工时，具体信息如下，工单详见附件，多谢。
项目号：41401150
项目名称：TCL-IT技术服务2024-2026人力外包项目
工作职责：新方舟前端模块顾问
顾问姓名：${name}
工作月份：${dayjs(curMonth).format("YYYY年MM月")}
工作人天：${totalDays}

深圳普菲特信息科技股份有限公司	`,
  };
  console.log(this.model, "blob");

  console.warn();
}
