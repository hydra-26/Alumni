from flask import Blueprint, request, jsonify
from supabase_client import get_supabase

alumni_bp = Blueprint("alumni", __name__)


@alumni_bp.get("/")
def list_alumni():
    sb = get_supabase()
    query = sb.table("alumni").select("*").order("created_at", desc=True)

    # Optional filters
    batch = request.args.get("batch")
    status = request.args.get("status")
    course = request.args.get("course")
    search = request.args.get("q")

    if batch:
        query = query.eq("batch_year", batch)
    if status:
        query = query.eq("employment_status", status)
    if course:
        query = query.eq("course", course)
    if search:
        query = query.or_(f"first_name.ilike.%{search}%,last_name.ilike.%{search}%,course.ilike.%{search}%,batch_year.ilike.%{search}%")

    result = query.execute()
    return jsonify(result.data)


@alumni_bp.get("/<int:alumnus_id>")
def get_alumnus(alumnus_id):
    sb = get_supabase()
    result = sb.table("alumni").select("*").eq("id", alumnus_id).single().execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data)


@alumni_bp.post("/")
def create_alumnus():
    data = request.get_json()
    sb = get_supabase()
    result = sb.table("alumni").insert({
        "first_name":        data.get("first_name"),
        "last_name":         data.get("last_name"),
        "batch_year":        data.get("batch_year"),
        "course":            data.get("course"),
        "email":             data.get("email"),
        "contact":           data.get("contact"),
        "employment_status": data.get("employment_status"),
        "company":           data.get("company"),
        "skills":            data.get("skills"),
    }).execute()
    return jsonify(result.data[0]), 201


@alumni_bp.put("/<int:alumnus_id>")
def update_alumnus(alumnus_id):
    data = request.get_json()
    sb = get_supabase()
    result = sb.table("alumni").update(data).eq("id", alumnus_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data[0])


@alumni_bp.delete("/<int:alumnus_id>")
def delete_alumnus(alumnus_id):
    sb = get_supabase()
    sb.table("alumni").delete().eq("id", alumnus_id).execute()
    return jsonify({"message": "Deleted"})
