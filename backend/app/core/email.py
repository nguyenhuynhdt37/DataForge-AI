import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from loguru import logger
from app.core.config import settings

class EmailService:
    @staticmethod
    def _create_otp_html(
        user_name: str, 
        otp_code: str, 
        ip_address: str, 
        user_agent: str, 
        requested_at: str
    ) -> str:
        """Tạo giao diện HTML email mã OTP mang nhận diện thương hiệu GreenSM."""
        return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác thực GreenSM Hub</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c0d0e; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner GreenSM -->
          <tr>
            <td style="background: linear-gradient(135deg, #00A651 0%, #059669 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ⚡ GreenSM MLOps Hub
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">
                Enterprise Vision & HITL Studio
              </p>
            </td>
          </tr>

          <!-- Nội dung chính -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                Xin chào {user_name},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                Hệ thống phát hiện yêu cầu đăng nhập từ một <strong style="color: #34d399;">thiết bị hoặc địa chỉ IP mới</strong> vào tài khoản của bạn. Để đảm bảo an toàn, vui lòng sử dụng mã xác thực một lần (OTP) dưới đây:
              </p>

              <!-- Ô hiển thị mã OTP -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="background-color: #09090b; border: 2px dashed #00A651; border-radius: 12px; padding: 22px;">
                    <span style="font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #10b981; display: inline-block;">
                      {otp_code}
                    </span>
                    <div style="margin-top: 8px; font-size: 12px; color: #71717a;">
                      Mã có hiệu lực trong vòng <strong>5 phút</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Chi tiết thiết bị đăng nhập -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a50; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #71717a; padding: 3px 0;">Địa chỉ IP:</td>
                  <td style="font-size: 12px; color: #e4e4e7; font-weight: 600; text-align: right; padding: 3px 0;">{ip_address}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #71717a; padding: 3px 0;">Thời gian:</td>
                  <td style="font-size: 12px; color: #e4e4e7; font-weight: 600; text-align: right; padding: 3px 0;">{requested_at}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #71717a; padding: 3px 0;">Thiết bị:</td>
                  <td style="font-size: 12px; color: #e4e4e7; text-align: right; padding: 3px 0; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{user_agent}</td>
                </tr>
              </table>

              <!-- Cảnh báo bảo mật -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #ef4444;">
                ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên quản trị GreenSM. Nếu bạn không thực hiện thao tác này, vui lòng đổi mật khẩu ngay lập tức.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #27272a; padding: 20px 32px; background-color: #121214; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                © 2026 GreenSM MLOps Platform • Bảo mật & Tuân thủ nội bộ
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    @classmethod
    def _send_sync_smtp(
        cls, 
        to_email: str, 
        subject: str, 
        html_content: str
    ) -> bool:
        """Hàm đồng bộ gửi email qua SMTP socket với TLS."""
        if not settings.SMTP_ENABLED or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("⚠️ SMTP chưa được kích hoạt hoặc thiếu tài khoản/mật khẩu.")
            return False

        # Làm sạch khoảng trắng trong mật khẩu app password (nếu người dùng copy dạng 'xxxx xxxx')
        cleaned_password = settings.SMTP_PASSWORD.replace(" ", "")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
        msg["To"] = to_email

        # Đính kèm nội dung HTML
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USER, cleaned_password)
                server.sendmail(msg["From"], [to_email], msg.as_string())
            logger.info(f"📧 Đã gửi email OTP thành công tới: {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Lỗi gửi email qua SMTP: {e}")
            return False

    @classmethod
    async def send_otp_email(
        cls,
        to_email: str,
        otp_code: str,
        user_name: str = "Thành viên GreenSM",
        ip_address: str = "127.0.0.1",
        user_agent: str = "Unknown"
    ) -> bool:
        """Gửi email OTP bất đồng bộ (Non-blocking) kèm fallback log cho developer."""
        now_str = datetime.now().strftime("%H:%M:%S %d/%m/%Y")
        html_body = cls._create_otp_html(
            user_name=user_name,
            otp_code=otp_code,
            ip_address=ip_address,
            user_agent=user_agent,
            requested_at=now_str
        )
        subject = f"[{otp_code}] Mã xác thực đăng nhập GreenSM Hub"

        # Luôn in mã ra console log để developer quan sát tức thì
        logger.info(
            f"🔐 [AUTH OTP DEV LOG] Gửi mã OTP '{otp_code}' đến: {to_email} (IP: {ip_address})"
        )

        # Chạy tác vụ gửi SMTP trong thread riêng để không block FastAPI event loop
        try:
            success = await asyncio.to_thread(
                cls._send_sync_smtp, 
                to_email, 
                subject, 
                html_body
            )
            return success
        except Exception as e:
            logger.error(f"❌ Exception khi chạy thread gửi email: {e}")
            return False

email_service = EmailService()
