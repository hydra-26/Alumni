import json
import os
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

def resolve_system_url() -> str:
    return os.environ.get("SYSTEM_URL") or "http://localhost:5173"

def _truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() not in {"", "0", "false", "no", "off"}

def _parse_sender(value: str | None, fallback_email: str) -> dict:
    name, email = parseaddr(value or "")
    email = email or fallback_email
    return {
        "name": name or email,
        "email": email,
    }

def _send_via_brevo_api(*, api_key: str, to_email: str, display_name: str, sender_value: str | None, subject: str, text_body: str, debug: bool) -> bool:
    sender = _parse_sender(sender_value, to_email)
    payload = {
        "sender": sender,
        "to": [{"email": to_email, "name": display_name or to_email}],
        "subject": subject,
        "textContent": text_body,
    }
    request = Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key,
            "content-type": "application/json",
            "accept": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=15) as response:
            if 200 <= response.status < 300:
                return True
            if debug:
                body = response.read().decode("utf-8", errors="replace")
                print(f"EMAIL_DEBUG: Brevo API non-2xx: {response.status} {body}")
            return False
    except HTTPError as exc:
        if debug:
            body = exc.read().decode("utf-8", errors="replace")
            print(f"EMAIL_DEBUG: Brevo API error: {exc.code} {body}")
        return False
    except URLError as exc:
        if debug:
            print(f"EMAIL_DEBUG: Brevo API connection failed: {exc}")
        return False

def send_user_credentials_email(*, to_email: str | None, name: str, username: str | None, password: str | None, role: str | None, system_url: str) -> bool:
    debug = _truthy(os.environ.get("EMAIL_DEBUG"))
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    brevo_api_key = os.environ.get("BREVO_API_KEY")
    if not smtp_host or not smtp_user or not smtp_pass or not to_email:
        if not brevo_api_key or not to_email:
            if debug:
                print(
                    "EMAIL_DEBUG: Missing email config:",
                    {
                        "smtp_host": bool(smtp_host),
                        "smtp_user": bool(smtp_user),
                        "smtp_pass": bool(smtp_pass),
                        "brevo_api_key": bool(brevo_api_key),
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

    subject = "Your APPAS account credentials"
    text_body = (
        f"Hello {display_name},\n\n"
        "Your APPAS account has been created. You can sign in using the details below:\n\n"
        f"System link: {system_url}\n"
        f"Email: {login_id}\n"
        f"Password: {password or ''}\n\n"
        "If you did not expect this email, please ignore it."
    )

    if brevo_api_key:
        return _send_via_brevo_api(
            api_key=brevo_api_key,
            to_email=to_email,
            display_name=display_name,
            sender_value=smtp_from,
            subject=subject,
            text_body=text_body,
            debug=debug,
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = to_email

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


def send_password_reset_email(*, to_email: str | None, name: str, verification_code: str, system_url: str) -> bool:
    debug = _truthy(os.environ.get("EMAIL_DEBUG"))
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    brevo_api_key = os.environ.get("BREVO_API_KEY")
    if not to_email:
        return False
    if not smtp_host or not smtp_user or not smtp_pass:
        if not brevo_api_key:
            if debug:
                print(
                    "EMAIL_DEBUG: Missing email config for password reset:",
                    {
                        "smtp_host": bool(smtp_host),
                        "smtp_user": bool(smtp_user),
                        "smtp_pass": bool(smtp_pass),
                        "brevo_api_key": bool(brevo_api_key),
                        "to_email": bool(to_email),
                    },
                )
            return False

    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_from = os.environ.get("SMTP_FROM") or smtp_user
    use_ssl = _truthy(os.environ.get("SMTP_USE_SSL"))
    use_tls = _truthy(os.environ.get("SMTP_USE_TLS", "true"))

    display_name = name or to_email
    subject = "Verify your APPAS password reset"
    text_body = (
        f"Hello {display_name},\n\n"
        "We received a request to reset your APPAS account password.\n\n"
        f"Verification code: {verification_code}\n\n"
        f"Open the sign-in page here: {system_url}\n"
        "Enter the code in the Forgot Password modal, verify your email, then set a new password.\n\n"
        "If you did not request this change, you can safely ignore this email."
    )

    if brevo_api_key:
        return _send_via_brevo_api(
            api_key=brevo_api_key,
            to_email=to_email,
            display_name=display_name,
            sender_value=smtp_from,
            subject=subject,
            text_body=text_body,
            debug=debug,
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = to_email
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
            print(f"EMAIL_DEBUG: SMTP reset email failed: {type(exc).__name__}: {exc}")
        return False

    return True
