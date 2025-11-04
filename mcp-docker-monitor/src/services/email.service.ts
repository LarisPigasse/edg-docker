import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendAlert(subject: string, message: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ALERT_EMAIL,
      subject: `[ALERT] ${subject}`,
      text: message,
      html: `<p>${message}</p>`,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
