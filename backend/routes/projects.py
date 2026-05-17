from flask import Blueprint, request, jsonify
from supabase_client import get_supabase
from audit import log_audit, AUDIT_COLORS

projects_bp = Blueprint("projects", __name__)

PROJECT_FIELDS = [
    "title",
    "category",
    "year",
    "adviser",
    "members",
    "status",
    "award",
    "abstract",
    "project_link",
]


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
    data = request.get_json(silent=True) or {}
    payload = {key: data.get(key) for key in PROJECT_FIELDS}
    sb = get_supabase()
    result = sb.table("projects").insert(payload).execute()
    created = result.data[0] if result.data else {}
    title = created.get("title") or "Project"
    log_audit(f"Project added: {title}", color=AUDIT_COLORS["project"], sb=sb)
    return jsonify(result.data[0]), 201


@projects_bp.post("/bulk")
def create_projects_bulk():
    data = request.get_json() or []
    if not isinstance(data, list) or not data:
        return jsonify({"error": "No records provided"}), 400

    payloads = []
    for item in data:
        payloads.append({key: item.get(key) for key in PROJECT_FIELDS})

    sb = get_supabase()
    # Log upload initiation with user identity when available
    user_identity = request.headers.get('X-User') or 'unknown'
    try:
        log_audit(f"Upload initiated by {user_identity}: {len(payloads)} project rows", color=AUDIT_COLORS["project"], sb=sb)
    except Exception:
        pass

    result = sb.table("projects").insert(payloads).execute()
    inserted = result.data or []
    # Record upload history
    try:
        actor = request.headers.get('X-User') or 'unknown'
        file_name = request.headers.get('X-File-Name')
        sb.table('upload_history').insert({
            'dataset': 'projects',
            'rows_count': len(inserted),
            'actor': actor,
            'file_name': file_name,
        }).execute()
    except Exception:
        pass

    log_audit(f"Uploaded {len(inserted)} project records", color=AUDIT_COLORS["project"], sb=sb)
    return jsonify({"inserted": len(inserted), "data": inserted}), 201


@projects_bp.put("/<int:project_id>")
def update_project(project_id):
    data = request.get_json(silent=True) or {}
    payload = {key: data.get(key) for key in PROJECT_FIELDS if key in data}
    sb = get_supabase()
    result = sb.table("projects").update(payload).eq("id", project_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    updated = result.data[0]
    title = updated.get("title") or f"Project #{project_id}"
    log_audit(f"Project updated: {title}", color=AUDIT_COLORS["project"], sb=sb)
    return jsonify(updated)


@projects_bp.delete("/<int:project_id>")
def delete_project(project_id):
    sb = get_supabase()
    target = sb.table("projects").select("title").eq("id", project_id).single().execute()
    title = target.data.get("title") if target.data else None
    title = title or f"Project #{project_id}"
    sb.table("projects").delete().eq("id", project_id).execute()
    log_audit(f"Project deleted: {title}", color=AUDIT_COLORS["project"], sb=sb)
    return jsonify({"message": "Deleted"})
