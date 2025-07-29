import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 解析请求中的 JSON 数据和文件
    const formData = await req.formData();

    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const text = formData.get("text") as string;
    const file = formData.get("file");
    const name = formData.get("name") as string;

    // 如果有文件，读取文件内容并转换为 Buffer
    let attachments: nodemailer.AttachmentLike[] = [];
    if (file instanceof File) {
      const buffer = await file.arrayBuffer(); // 将 File 转换为 ArrayBuffer
      const content = Buffer.from(buffer); // 将 ArrayBuffer 转换为 Buffer
      attachments.push({
        filename: name,
        content,
      });
    }
    // 配置 QQ 邮箱的 SMTP 服务
    const transporter = nodemailer.createTransport({
      host: "smtp.qq.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.QQ_EMAIL,
        pass: process.env.QQ_EMAIL_PASSWORD,
      },
    });

    // 创建邮件选项
    const mailOptions = {
      from: process.env.QQ_EMAIL,
      to,
      subject,
      text,
      attachments,
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to send email",
      status: 500,
      details: error.message,
    });
  }
}
