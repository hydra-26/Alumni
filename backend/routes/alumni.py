from flask import Blueprint, request, jsonify
from supabase_client import get_supabase
from audit import log_audit, AUDIT_COLORS

alumni_bp = Blueprint("alumni", __name__)

ALUMNI_FIELDS = [
    "first_name",
    "last_name",
    "batch_year",
    "course",
    "email",
    "contact",
    "employment_status",
    "company",
]

ALUMNI_SELECT = (
    "id,first_name,last_name,batch_year,course,email,contact,employment_status,company,created_at"
)


@alumni_bp.get("/")
def list_alumni():
    sb = get_supabase()
    query = sb.table("alumni").select(ALUMNI_SELECT).order("created_at", desc=True)

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
    result = sb.table("alumni").select(ALUMNI_SELECT).eq("id", alumnus_id).single().execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data)


@alumni_bp.post("/")
def create_alumnus():
    data = request.get_json() or {}
    payload = {key: data.get(key) for key in ALUMNI_FIELDS}
    sb = get_supabase()
    result = sb.table("alumni").insert(payload).execute()
    created = result.data[0] if result.data else {}
    name = f"{created.get('first_name', '')} {created.get('last_name', '')}".strip() or f"Alumnus #{created.get('id', '')}".strip()
    log_audit(f"Alumni record added: {name}", color=AUDIT_COLORS["alumni"], sb=sb)
    return jsonify(result.data[0]), 201


@alumni_bp.put("/<int:alumnus_id>")
def update_alumnus(alumnus_id):
    data = request.get_json() or {}
    payload = {key: data.get(key) for key in ALUMNI_FIELDS if key in data}
    if not payload:
        return jsonify({"error": "No updatable fields provided"}), 400
    sb = get_supabase()
    result = sb.table("alumni").update(payload).eq("id", alumnus_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    updated = result.data[0]
    name = f"{updated.get('first_name', '')} {updated.get('last_name', '')}".strip() or f"Alumnus #{alumnus_id}"
    log_audit(f"Alumni record updated: {name}", color=AUDIT_COLORS["alumni"], sb=sb)
    return jsonify(updated)


@alumni_bp.delete("/<int:alumnus_id>")
def delete_alumnus(alumnus_id):
    sb = get_supabase()
    target = sb.table("alumni").select("first_name,last_name").eq("id", alumnus_id).single().execute()
    name = None
    if target.data:
        name = f"{target.data.get('first_name', '')} {target.data.get('last_name', '')}".strip()
    name = name or f"Alumnus #{alumnus_id}"
    sb.table("alumni").delete().eq("id", alumnus_id).execute()
    log_audit(f"Alumni record deleted: {name}", color=AUDIT_COLORS["alumni"], sb=sb)
    return jsonify({"message": "Deleted"})
