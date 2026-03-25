from flask import Blueprint, jsonify
from supabase_client import get_supabase

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/kpis")
def kpis():
    sb = get_supabase()

    alumni_count   = sb.table("alumni").select("id", count="exact").execute().count or 0
    projects_count = sb.table("projects").select("id", count="exact").execute().count or 0
    awarded_count  = sb.table("projects").select("id", count="exact").eq("status", "Awarded").execute().count or 0
    implemented    = sb.table("projects").select("id", count="exact").eq("status", "Implemented").execute().count or 0

    # Employment rate
    employed = sb.table("alumni").select("id", count="exact").eq("employment_status", "Employed").execute().count or 0
    emp_rate = round((employed / alumni_count * 100), 1) if alumni_count > 0 else 0
    impl_rate = round((implemented / projects_count * 100), 1) if projects_count > 0 else 0

    return jsonify({
        "total_alumni":    alumni_count,
        "total_projects":  projects_count,
        "employment_rate": emp_rate,
        "award_winning":   awarded_count,
        "implemented_rate": impl_rate,
    })


@analytics_bp.get("/projects-per-year")
def projects_per_year():
    sb = get_supabase()
    result = sb.table("projects").select("year, status").execute()
    rows = result.data or []

    years = sorted(set(r["year"] for r in rows if r.get("year")))
    data = {}
    for y in years:
        total   = sum(1 for r in rows if r["year"] == y)
        awarded = sum(1 for r in rows if r["year"] == y and r.get("status") == "Awarded")
        data[y] = {"total": total, "awarded": awarded}

    return jsonify(data)


@analytics_bp.get("/categories")
def categories():
    sb = get_supabase()
    result = sb.table("projects").select("category").execute()
    rows = result.data or []
    counts = {}
    for r in rows:
        cat = r.get("category", "Other")
        counts[cat] = counts.get(cat, 0) + 1
    return jsonify(counts)


@analytics_bp.get("/employment-trend")
def employment_trend():
    sb = get_supabase()
    result = sb.table("alumni").select("batch_year, employment_status").execute()
    rows = result.data or []

    years = sorted(set(r["batch_year"] for r in rows if r.get("batch_year")))
    data = {}
    for y in years:
        year_rows = [r for r in rows if r.get("batch_year") == y]
        total     = len(year_rows)
        employed  = sum(1 for r in year_rows if r.get("employment_status") == "Employed")
        self_emp  = sum(1 for r in year_rows if r.get("employment_status") == "Self-Employed")
        data[y] = {
            "employed_pct":  round(employed / total * 100, 1) if total else 0,
            "self_emp_pct":  round(self_emp / total * 100, 1) if total else 0,
        }
    return jsonify(data)


@analytics_bp.get("/audit-logs")
def audit_logs():
    sb = get_supabase()
    result = sb.table("audit_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return jsonify(result.data or [])
