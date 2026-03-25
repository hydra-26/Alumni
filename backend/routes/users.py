from flask import Blueprint, request, jsonify
from supabase_client import get_supabase

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
    return jsonify(result.data[0]), 201


@users_bp.put("/<int:user_id>")
def update_user(user_id):
    data = request.get_json()
    data.pop("password", None)  # don't overwrite pw accidentally
    sb = get_supabase()
    result = sb.table("users").update(data).eq("id", user_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data[0])


@users_bp.delete("/<int:user_id>")
def delete_user(user_id):
    sb = get_supabase()
    sb.table("users").delete().eq("id", user_id).execute()
    return jsonify({"message": "Deleted"})
