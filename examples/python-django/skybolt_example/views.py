"""Views for Skybolt example project."""

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.shortcuts import render

from skybolt import Skybolt


def index(request):
    """Render the main page with Skybolt assets."""
    render_map_path = settings.BASE_DIR / "static" / "dist" / ".skybolt" / "render-map.json"

    # Convert Django cookies to dict
    cookies = {key: value for key, value in request.COOKIES.items()}

    sb = Skybolt(render_map_path, cookies=cookies)

    # Pre-render assets for Django template (Django doesn't support method calls with args)
    return render(request, "index.html", {
        "critical_css": sb.css("static/css/critical.css"),
        "app_css": sb.css("static/css/app.css"),
        "app_js": sb.script("static/js/app.js"),
        "launch_script": sb.launch_script(),
        "version": Skybolt.VERSION,
    })


def service_worker(request):
    """Serve the Skybolt service worker."""
    sw_path = settings.BASE_DIR / "static" / "dist" / "skybolt-sw.js"

    if not sw_path.exists():
        raise Http404("Service Worker not found. Run 'npm run build' first.")

    response = FileResponse(
        open(sw_path, "rb"),
        content_type="application/javascript"
    )
    response["Service-Worker-Allowed"] = "/"
    response["Cache-Control"] = "public, max-age=86400"
    return response
