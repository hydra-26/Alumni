from flask import request
from supabase_client import get_supabase

AUDIT_COLORS = {
    "default": "#0a3d8f",
    "user": "#0a3d8f",
    "alumni": "#0a3d8f",
    "project": "#d4a800",
    "export": "#0d8a5e",
    "auth": "#0077b6",
}


def resolve_actor(explicit_actor=None):
    if explicit_actor:
        return explicit_actor
    try:
        header_actor = request.headers.get("X-User")
    except Exception:
        header_actor = None
    return header_actor or "system"


def log_audit(action, actor=None, color=None, sb=None):
    if not action:
        return
    try:
        supabase = sb or get_supabase()
        supabase.table("audit_logs").insert({
            "action": action,
            "actor": resolve_actor(actor),
            "color": color or AUDIT_COLORS["default"],
        }).execute()
    except Exception:
        # Ignore logging failures to avoid breaking main requests.
        return
