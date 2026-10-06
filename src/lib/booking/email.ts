import { formatDateTime } from "./time";
import type { BookingRequest } from "./types";

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM || "Loc Digital <hi@loc.digital>";
  if (!apiKey) return { sent: false, error: "RESEND_API_KEY is not configured." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { sent: false, error: data.message || "Email provider request failed." };
  return { sent: true };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
}

export async function sendPendingReceipt(booking: BookingRequest) {
  const time = formatDateTime(booking.starts_at, booking.owner_timezone);
  return sendEmail(
    booking.visitor_email,
    "Lộc đã nhận yêu cầu lịch hẹn của bạn",
    `<p>Xin chào ${escapeHtml(booking.visitor_name)},</p><p>Yêu cầu lịch hẹn <strong>${escapeHtml(booking.subject)}</strong> vào <strong>${time}</strong> đã được gửi.</p><p>Lịch hẹn chỉ được xác nhận sau khi Lộc duyệt. Nếu được duyệt, bạn sẽ nhận email xác nhận và lời mời Google Calendar.</p>`,
  );
}

export async function sendOwnerNotification(booking: BookingRequest) {
  const ownerEmail = process.env.BOOKING_OWNER_EMAIL || "hi@loc.digital";
  const time = formatDateTime(booking.starts_at, booking.owner_timezone);
  return sendEmail(
    ownerEmail,
    `Yêu cầu lịch hẹn mới: ${booking.subject}`,
    `<p>Có yêu cầu lịch hẹn mới đang chờ duyệt.</p><ul><li><strong>Khách:</strong> ${escapeHtml(booking.visitor_name)} (${escapeHtml(booking.visitor_email)})</li><li><strong>Thời gian:</strong> ${time}</li><li><strong>Chủ đề:</strong> ${escapeHtml(booking.subject)}</li></ul><p>${escapeHtml(booking.description || "")}</p>`,
  );
}

export async function sendConfirmation(booking: BookingRequest) {
  const time = formatDateTime(booking.starts_at, booking.owner_timezone);
  return sendEmail(
    booking.visitor_email,
    "Lịch hẹn đã được xác nhận",
    `<p>Xin chào ${escapeHtml(booking.visitor_name)},</p><p>Lịch hẹn <strong>${escapeHtml(booking.subject)}</strong> đã được xác nhận.</p><p><strong>Thời gian:</strong> ${time}</p><p>Bạn sẽ nhận được lời mời Google Calendar trong email này.</p>`,
  );
}

export async function sendRejection(booking: BookingRequest, reason?: string) {
  const time = formatDateTime(booking.starts_at, booking.owner_timezone);
  return sendEmail(
    booking.visitor_email,
    "Yêu cầu lịch hẹn chưa thể xác nhận",
    `<p>Xin chào ${escapeHtml(booking.visitor_name)},</p><p>Yêu cầu lịch hẹn <strong>${escapeHtml(booking.subject)}</strong> vào <strong>${time}</strong> chưa thể xác nhận.</p>${reason ? `<p>Lý do: ${escapeHtml(reason)}</p>` : ""}<p>Bạn có thể gửi lại yêu cầu với khung giờ khác.</p>`,
  );
}
