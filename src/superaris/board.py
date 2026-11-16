"""Read existing project records without probing or controlling native owners."""
from __future__ import annotations

from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib import resources
import json
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlsplit
import webbrowser

from .state import directory


def collect(project: Path) -> dict:
    project = project.expanduser().resolve()
    if not project.is_dir():
        raise ValueError("Selected project directory does not exist")
    root = directory(project)
    sources, warnings = [], []

    def read_object(path):
        name = str(path.relative_to(project))
        source = {"path": name, "modified_at": None, "status": "missing"}
        sources.append(source)
        try:
            if not path.resolve().is_relative_to(project):
                raise ValueError("Record is outside the selected project")
            value = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(value, dict):
                raise ValueError("Expected a JSON object")
            source.update(status="read", modified_at=datetime.fromtimestamp(
                path.stat().st_mtime, timezone.utc).isoformat())
            return value
        except FileNotFoundError:
            return {}
        except (OSError, ValueError) as exc:
            source["status"] = "unreadable"
            warnings.append(f"{name}: {exc}")
            return {}

    def records(folder):
        if not folder.resolve().is_relative_to(project):
            warnings.append(f"{folder.relative_to(project)}: outside selected project")
            return []
        try:
            return sorted(folder.glob("*.json"))
        except OSError as exc:
            warnings.append(f"{folder.relative_to(project)}: {exc}")
            return []

    bound = read_object(root / "launch.json")
    bridge = read_object(root / "bridge.json")
    receiver = read_object(root / "receiver.json")
    control = read_object(root / "receiver-control.json")
    roles, tasks = [], []
    attempts = bridge.get("attempts", {})
    delivered = bridge.get("delivered", {})
    for name, role in (bound.get("roles") or {}).items():
        if not isinstance(role, dict):
            continue
        inputs, context_delivery = role.get("inputs", {}), role.get("delivery", {})
        roles.append({"id": name, "harness": role.get("harness"),
                      "requested_model": role.get("requested_model"),
                      "recorded_status": role.get("status", "unknown"),
                      "automation_owned": bool(role.get("automation_owned")),
                      "task": inputs.get("task"), "write_scope": inputs.get("write_scope"),
                      "delivery": context_delivery.get("phase", "unknown"),
                      "pending_unknown": context_delivery.get("phase") in {"unknown", "attempting"}})
    for path in records(root / "handles"):
        handle = read_object(path)
        if not handle:
            continue
        # The existing filename is the lookup key; never use an arbitrary ID as
        # an additional filesystem path or follow a query/record pointer.
        identifier = path.stem
        reports = []
        for report_path in records(root / "reports" / identifier):
            report = read_object(report_path)
            if report:
                reports.append({"outcome": report.get("outcome"), "message": report.get("message"),
                                "time": report.get("time"), "acceptance": report.get("acceptance", "not_evaluated"),
                                "path": str(report_path.relative_to(project))})
        delivery = handle.get("last_delivery", {})
        if isinstance(delivered.get(identifier), dict):
            delivery = delivered[identifier]
        tasks.append({"id": identifier, "owner_role": handle.get("owner_role", "main"),
                      "worker_role": handle.get("worker_role"), "active": bool(handle.get("active")),
                      "wait_for": handle.get("wait_for"), "query": handle.get("query"),
                      "next_authorized": handle.get("next_authorized"), "record": handle.get("record"),
                      "deliverables": handle.get("deliverables", []), "receipt": handle.get("receipt"),
                      "acceptance": "consult_original_record", "delivery": delivery.get("delivery"),
                      "pending_unknown": identifier in attempts, "reports": reports})
    return {"schema_version": 1,
            "project": {"name": project.name, "path": str(project), "host": bound.get("host", "herdr"),
                        "ui_language": bound.get("ui_language", "zh")},
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "roles": roles, "tasks": tasks,
            "receiver": {"recorded_status": receiver.get("status", "unknown"),
                         "enabled": control.get("enabled"),
                         "reason": receiver.get("outcome", {}).get("reason"),
                         "error": receiver.get("outcome", {}).get("error")},
            "sources": sources, "warnings": warnings}


def render(data: dict, language: str | None = None) -> str:
    en = (language or data["project"]["ui_language"]) == "en"
    lines = [f"SuperARIS · {data['project']['name']}",
             "Project records (not a live process probe)" if en else "项目记录（未探活进程）"]
    for role in data["roles"]:
        lines += [f"\n{role['id']} · {role['harness']} · {role['requested_model'] or ('native settings' if en else '原生设置')}",
                  str(role["task"] or "—")]
    for task in data["tasks"]:
        state = ("waiting" if task["active"] else "wait closed") if en else ("等待中" if task["active"] else "等待已结束")
        lines += [f"\n[{task['id']}] {task['worker_role'] or 'external'} → {task['owner_role']} · {state}",
                  f"{'Waiting for' if en else '所等结果'}: {task['wait_for']}"]
        if task["reports"]:
            report = task["reports"][-1]
            lines.append(f"{report['time']} · {report['outcome']}: {report['message']}")
        if task["pending_unknown"]:
            lines.append("Delivery needs inspection" if en else "投递待核实")
        lines += [f"{'Next authorized' if en else '下一已授权动作'}: {task['next_authorized']}",
                  f"{'Acceptance: consult original record' if en else '验收见原记录'}: {task['receipt'] or task['record'] or '—'}"]
    lines += [f"\n{'Recorded receiver' if en else '收件记录'}: {data['receiver']['recorded_status']}"]
    lines.extend(data["warnings"])
    return "\n".join(lines)


def create_server(project: Path, port: int = 0) -> ThreadingHTTPServer:
    project = project.expanduser().resolve()
    collect(project)  # Validate before binding; never creates project metadata.

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_GET(self):
            if self.headers.get("Host") not in {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}:
                self.send_error(403)
                return
            path = urlsplit(self.path).path
            try:
                if path == "/api/board":
                    body, content_type = json.dumps(collect(project), ensure_ascii=False).encode(), "application/json"
                elif path == "/":
                    body = resources.files("superaris").joinpath("resources/board.html").read_bytes()
                    content_type = "text/html"
                else:
                    self.send_error(404)
                    return
            except (OSError, ValueError) as exc:
                self.send_error(503, "Project records unavailable")
                return
            self.send_response(200)
            self.send_header("Content-Type", content_type + "; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def serve(project: Path, port: int = 0, open_browser: bool = False, language: str | None = None) -> int:
    with create_server(project, port) as server:
        url = f"http://127.0.0.1:{server.server_port}/" + (f"?lang={language}" if language else "")
        print(f"SuperARIS board: {url}\nCtrl+C stops this read-only view; original team and receiver remain unchanged.", flush=True)
        if open_browser:
            if sys.platform == "darwin":
                subprocess.Popen(["open", "-a", "Microsoft Edge", url])
            else:
                webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0
