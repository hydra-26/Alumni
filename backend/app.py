from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import re

from routes.auth import auth_bp
from routes.alumni import alumni_bp
from routes.projects import projects_bp
from routes.users import users_bp
from routes.analytics import analytics_bp

load_dotenv()

app = Flask(__name__)
app.url_map.strict_slashes = False

# Use FRONTEND_ORIGINS for explicit domains and allow Vercel preview domains.
# Example: FRONTEND_ORIGINS=https://your-prod.vercel.app,https://your-custom-domain.com
configured_origins = [
    origin.strip()
    for origin in os.environ.get("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    *configured_origins,
    re.compile(r"https://.*\.vercel\.app$"),
]

CORS(app, origins=allowed_origins, supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp,      url_prefix="/api/auth")
app.register_blueprint(alumni_bp,    url_prefix="/api/alumni")
app.register_blueprint(projects_bp,  url_prefix="/api/projects")
app.register_blueprint(users_bp,     url_prefix="/api/users")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

@app.route("/api/health")
def health():
    return {"status": "ok", "app": "APPAS — PSU"}

# if __name__ == "__main__":
#     app.run(debug=True, port=5000)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 5000)), 
        debug=os.environ.get("FLASK_ENV") == "development"
        )
    
    
# app = Flask(__name__)
# # CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])
# CORS(app, origins=[
#     "http://localhost:5173",
#     "http://localhost:3000",
#     "https://alumni-blush-alpha.vercel.app",  # replace with your actual Vercel URL later
#     "https://alumni-3rlfp1lk8-hydra-26s-projects.vercel.app"
# ], supports_credentials=True)
