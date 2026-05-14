import os
import smtplib
from email.message import EmailMessage

def resolve_system_url() -> str:
    return os.environ.get("SYSTEM_URL") or "http://localhost:5173"

def _truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() not in {"", "0", "false", "no", "off"}

def send_user_credentials_email(*, to_email: str | None, name: str, username: str | None, password: str | None, role: str | None, system_url: str) -> bool:
    debug = _truthy(os.environ.get("EMAIL_DEBUG"))
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    if not smtp_host or not smtp_user or not smtp_pass or not to_email:
        if debug:
            print(
                "EMAIL_DEBUG: Missing SMTP config:",
                {
                    "smtp_host": bool(smtp_host),
                    "smtp_user": bool(smtp_user),
                    "smtp_pass": bool(smtp_pass),
                    "to_email": bool(to_email),
                },
            )
        return False

    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_from = os.environ.get("SMTP_FROM") or smtp_user
    use_ssl = _truthy(os.environ.get("SMTP_USE_SSL"))
    use_tls = _truthy(os.environ.get("SMTP_USE_TLS", "true"))

    display_name = name or to_email
    login_id = username or to_email

    msg = EmailMessage()
    msg["Subject"] = "Your APPAS account credentials"
    msg["From"] = smtp_from
    msg["To"] = to_email

    text_body = (
        f"Hello {display_name},\n\n"
        "Your APPAS account has been created. You can sign in using the details below:\n\n"
        f"System link: {system_url}\n"
        f"Username: {login_id}\n"
        f"Password: {password or ''}\n\n"
        f"Role: {role or ''}\n\n"
        "If you did not expect this email, please ignore it."
    )

    msg.set_content(text_body)

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
    except Exception as exc:
        if debug:
            print(f"EMAIL_DEBUG: SMTP send failed: {type(exc).__name__}: {exc}")
        return False

    return True
