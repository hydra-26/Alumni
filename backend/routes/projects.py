from flask import Blueprint, request, jsonify
from supabase_client import get_supabase

projects_bp = Blueprint("projects", __name__)


@projects_bp.get("/")
def list_projects():
    sb = get_supabase()
    query = sb.table("projects").select("*").order("created_at", desc=True)

    category = request.args.get("category")
    status   = request.args.get("status")
    year     = request.args.get("year")
    search   = request.args.get("q")

    if category:
        query = query.eq("category", category)
    if status:
        query = query.eq("status", status)
    if year:
        query = query.eq("year", year)
    if search:
        query = query.ilike("title", f"%{search}%")

    result = query.execute()
    return jsonify(result.data)


@projects_bp.get("/<int:project_id>")
def get_project(project_id):
    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).single().execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data)


@projects_bp.post("/")
def create_project():
    data = request.get_json()
    sb = get_supabase()
    result = sb.table("projects").insert({
        "title":    data.get("title"),
        "category": data.get("category"),
        "year":     data.get("year"),
        "adviser":  data.get("adviser"),
        "members":  data.get("members"),
        "status":   data.get("status"),
        "award":    data.get("award"),
        "abstract": data.get("abstract"),
    }).execute()
    return jsonify(result.data[0]), 201


@projects_bp.put("/<int:project_id>")
def update_project(project_id):
    data = request.get_json()
    sb = get_supabase()
    result = sb.table("projects").update(data).eq("id", project_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data[0])


@projects_bp.delete("/<int:project_id>")
def delete_project(project_id):
    sb = get_supabase()
    sb.table("projects").delete().eq("id", project_id).execute()
    return jsonify({"message": "Deleted"})
