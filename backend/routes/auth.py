from flask import Blueprint, request, jsonify
import re
import secrets
import time
from supabase_client import get_supabase
from audit import log_audit, AUDIT_COLORS
from email_utils import resolve_system_url, send_password_reset_email

auth_bp = Blueprint("auth", __name__)

RESET_CHALLENGES = {}
RESET_TTL_SECONDS = 15 * 60


def _cleanup_reset_challenges():
    now = time.time()
    expired = [challenge_id for challenge_id, challenge in RESET_CHALLENGES.items() if challenge["expires_at"] <= now]
    for challenge_id in expired:
        RESET_CHALLENGES.pop(challenge_id, None)


def _password_is_valid(password: str) -> bool:
    return bool(
        re.fullmatch(
            r"(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}",
            password or "",
        )
    )


@auth_bp.post("/login")
def login():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    sb = get_supabase()
    result = (
        sb.table("users")
        .select("id, first_name, last_name, email, role, status")
        .eq("email", email)
        .eq("password", password)   # In production use hashed passwords!
        .eq("status", "Active")
        .single()
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Invalid credentials"}), 401

    user = result.data
    log_audit(
        f"User login: {user['email']}",
        actor=user["email"],
        color=AUDIT_COLORS["auth"],
        sb=sb,
    )
    return jsonify({
        "user": {
            "id": user["id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "name": f"{user['first_name']} {user['last_name']}",
            "email": user["email"],
            "role": user["role"],
        }
    })


@auth_bp.post("/logout")
def logout():
    actor = request.headers.get("X-User")
    label = actor or "system"
    log_audit(f"User logout: {label}", actor=actor, color=AUDIT_COLORS["auth"])
    return jsonify({"message": "Logged out"})


@auth_bp.post("/password-reset/request")
def password_reset_request():
    _cleanup_reset_challenges()
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    sb = get_supabase()
    result = (
        sb.table("users")
        .select("id, first_name, last_name, email, status")
        .eq("email", email)
        .eq("status", "Active")
        .single()
        .execute()
    )

    if not result.data:
        return jsonify({"error": "No active account found for that email"}), 404

    user = result.data
    challenge_id = secrets.token_urlsafe(24)
    verification_code = f"{secrets.randbelow(1000000):06d}"
    RESET_CHALLENGES[challenge_id] = {
        "user_id": user["id"],
        "email": user["email"],
        "code": verification_code,
        "verified": False,
        "expires_at": time.time() + RESET_TTL_SECONDS,
    }

    emailed = send_password_reset_email(
        to_email=user["email"],
        name=f"{user['first_name']} {user['last_name']}",
        verification_code=verification_code,
        system_url=resolve_system_url(),
    )

    if not emailed:
        RESET_CHALLENGES.pop(challenge_id, None)
        return jsonify({"error": "Unable to send verification email"}), 500

    # Audit: record that a password reset was requested for this user
    try:
        log_audit(
            f"Password reset requested: {user['email']}",
            actor=user["email"],
            color=AUDIT_COLORS["auth"],
            sb=sb,
        )
    except Exception:
        # Don't fail the request if audit logging has an issue
        pass

    return jsonify({
        "message": "Verification code sent",
        "challenge_id": challenge_id,
        "expires_in": RESET_TTL_SECONDS,
    })


@auth_bp.post("/password-reset/verify")
def password_reset_verify():
    _cleanup_reset_challenges()
    data = request.get_json(force=True) or {}
    challenge_id = data.get("challenge_id", "").strip()
    code = data.get("code", "").strip()

    challenge = RESET_CHALLENGES.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Reset request expired or not found"}), 404

    if challenge["code"] != code:
        return jsonify({"error": "Invalid verification code"}), 400

    challenge["verified"] = True
    return jsonify({"message": "Email verified"})


@auth_bp.post("/password-reset/complete")
def password_reset_complete():
    _cleanup_reset_challenges()
    data = request.get_json(force=True) or {}
    challenge_id = data.get("challenge_id", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    challenge = RESET_CHALLENGES.get(challenge_id)
    if not challenge:
        return jsonify({"error": "Reset request expired or not found"}), 404

    if not challenge.get("verified"):
        return jsonify({"error": "Email has not been verified"}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    if not _password_is_valid(password):
        return jsonify({"error": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"}), 400

    sb = get_supabase()
    result = (
        sb.table("users")
        .update({"password": password})
        .eq("id", challenge["user_id"])
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Unable to update password"}), 500

    log_audit(
        f"Password reset completed: {challenge['email']}",
        actor=challenge["email"],
        color=AUDIT_COLORS["auth"],
        sb=sb,
    )
    RESET_CHALLENGES.pop(challenge_id, None)
    return jsonify({"message": "Password updated successfully"})


@auth_bp.post("/password-change")
def password_change():
    data = request.get_json(force=True) or {}
    current_password = data.get("current_password", "")
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    actor = request.headers.get("X-User", "").strip().lower()

    if not actor:
        return jsonify({"error": "Unable to identify current user"}), 400

    if not current_password:
        return jsonify({"error": "Current password is required"}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    if not _password_is_valid(password):
        return jsonify({"error": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"}), 400

    sb = get_supabase()
    result = (
        sb.table("users")
        .select("id, first_name, last_name, email, password")
        .eq("email", actor)
        .eq("status", "Active")
        .single()
        .execute()
    )

    user = result.data if result else None
    if not user:
        return jsonify({"error": "Current user not found"}), 404

    if user.get("password") != current_password:
        return jsonify({"error": "Current password is incorrect"}), 400

    if current_password == password:
        return jsonify({"error": "New password must be different from the current password"}), 400

    update_result = (
        sb.table("users")
        .update({"password": password})
        .eq("id", user["id"])
        .execute()
    )

    if not update_result.data:
        return jsonify({"error": "Unable to update password"}), 500

    log_audit(
        f"Password changed: {user['email']}",
        actor=user["email"],
        color=AUDIT_COLORS["auth"],
        sb=sb,
    )
    return jsonify({"message": "Password updated successfully"})
