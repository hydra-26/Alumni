from flask import Blueprint, request, jsonify
from supabase_client import get_supabase

auth_bp = Blueprint("auth", __name__)


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
    return jsonify({"message": "Logged out"})
