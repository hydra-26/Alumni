from flask import Blueprint, request, jsonify
from supabase_client import get_supabase
from audit import log_audit, AUDIT_COLORS
from email_utils import send_user_credentials_email, resolve_system_url

users_bp = Blueprint("users", __name__)


@users_bp.get("/")
def list_users():
    sb = get_supabase()
    query = sb.table("users").select("id, first_name, last_name, username, email, role, last_login, status").order("created_at", desc=True)
    role   = request.args.get("role")
    search = request.args.get("q")
    if role:
        query = query.eq("role", role)
    if search:
        query = query.or_(f"first_name.ilike.%{search}%,last_name.ilike.%{search}%,username.ilike.%{search}%")
    result = query.execute()
    return jsonify(result.data)


@users_bp.post("/")
def create_user():
    data = request.get_json()
    sb = get_supabase()
    result = sb.table("users").insert({
        "first_name":     data.get("first_name"),
        "last_name":      data.get("last_name"),
        "username":       data.get("username"),
        "email":          data.get("email"),
        "role":           data.get("role"),
        "password":       data.get("password"),   # hash in production!
        "status":         "Active",
    }).execute()
    created = result.data[0] if result.data else {}
    name = f"{created.get('first_name', '')} {created.get('last_name', '')}".strip() or created.get("email") or "User"
    log_audit(f"User created: {name}", color=AUDIT_COLORS["user"], sb=sb)
    email_sent = send_user_credentials_email(
        to_email=created.get("email"),
        name=name,
        username=created.get("username"),
        password=data.get("password"),
        role=created.get("role"),
        system_url=resolve_system_url(),
    )
    if email_sent:
        log_audit(f"Credentials email sent: {created.get('email')}", color=AUDIT_COLORS["user"], sb=sb)
    return jsonify(result.data[0]), 201


@users_bp.put("/<int:user_id>")
def update_user(user_id):
    data = request.get_json()
    data.pop("password", None)  # don't overwrite pw accidentally
    sb = get_supabase()
    result = sb.table("users").update(data).eq("id", user_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    updated = result.data[0]
    name = f"{updated.get('first_name', '')} {updated.get('last_name', '')}".strip() or updated.get("email") or f"User #{user_id}"
    log_audit(f"User updated: {name}", color=AUDIT_COLORS["user"], sb=sb)
    return jsonify(updated)


@users_bp.delete("/<int:user_id>")
def delete_user(user_id):
    sb = get_supabase()
    target = sb.table("users").select("first_name,last_name,email").eq("id", user_id).single().execute()
    name = None
    if target.data:
        name = f"{target.data.get('first_name', '')} {target.data.get('last_name', '')}".strip() or target.data.get("email")
    name = name or f"User #{user_id}"
    sb.table("users").delete().eq("id", user_id).execute()
    log_audit(f"User deleted: {name}", color=AUDIT_COLORS["user"], sb=sb)
    return jsonify({"message": "Deleted"})
