"""Read-only board behavior against synthetic, existing workbench records.

Integrate into tests/ and run against the installed wheel, as for other product
tests. No native owner, receiver, browser or model is started by these tests.
"""
from contextlib import contextmanager
import json
import subprocess
import threading
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

import pytest

from superaris import board
from tests.support import CLI


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")


def snapshot(project):
    """Compare paths and actual bytes, including empty directories."""
    return {str(path.relative_to(project)): path.read_bytes() if path.is_file() else None
            for path in project.rglob("*")}


def invoke(project, *options):
    return subprocess.run([*CLI, "board", str(project), *options],
                          capture_output=True, text=True, timeout=20, check=False)


@pytest.fixture
def project(tmp_path):
    project = tmp_path / "research-example"
    root = project / ".aris/workbench"
    write_json(root / "launch.json", {
        "project": str(project), "session": "synthetic-only", "host": "herdr", "ui_language": "en",
        "roles": {
            "main": {"pane_id": "w1:p1", "harness": "codex", "status": "idle",
                     "automation_owned": False, "inputs": {"task": "Verify the engineering artifact."}},
            "engineer": {"pane_id": "w1:p2", "harness": "agy", "requested_model": "native-default",
                         "status": "idle", "inputs": {"task": "Produce the experiment result.",
                                                      "write_scope": "experiment/"},
                         "delivery": {"phase": "submitted"}},
        },
    })
    (project / "CURRENT.md").write_text("Synthetic example: original acceptance is pending.\n", encoding="utf-8")
    write_json(root / "handles/experiment.json", {
        "id": "experiment", "owner_role": "main", "worker_role": "engineer", "active": True,
        "record": str(project / "CURRENT.md"), "deliverables": ["experiment/result.txt"],
        "wait_for": "Actual experiment artifact and explanation",
        "query": "original worker status example-job", "next_authorized": "Read the artifact and apply its original gate.",
        "paths": {}, "reports_seen": [], "last_worker_status": "idle",
        "last_delivery": {"delivery": "visible_notice"},
    })
    write_json(root / "reports/experiment/0001.json", {
        "id": "experiment", "outcome": "completed", "message": "Artifact ready for verification.",
        "time": "2026-11-16T01:00:00+00:00", "acceptance": "not_evaluated",
    })
    write_json(root / "bridge.json", {"attempts": {}, "delivered": {
        "experiment": {"delivery": "submitted", "pane_id": "w1:p1"},
    }})
    write_json(root / "receiver.json", {"status": "stopped", "outcome": {"reason": "explicit_stop"}})
    write_json(root / "receiver-control.json", {"enabled": False})
    return project


@contextmanager
def live_board(project):
    server = board.create_server(project)
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": .01}, daemon=True)
    thread.start()
    # Disable proxies only for requests made by this loopback test client.
    opener = build_opener(ProxyHandler({}))
    try:
        assert server.server_address[0] == "127.0.0.1"
        yield server, opener, f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
        assert not thread.is_alive()


def test_collect_reads_task_relationships_and_original_evidence_without_writes(project):
    before = snapshot(project)
    data = board.collect(project)
    task, = data["tasks"]
    assert task["worker_role"] == "engineer" and task["owner_role"] == "main"
    assert task["record"] == str(project / "CURRENT.md")
    assert task["deliverables"] == ["experiment/result.txt"]
    assert task["wait_for"] == "Actual experiment artifact and explanation"
    assert task["next_authorized"] == "Read the artifact and apply its original gate."
    assert data["receiver"]["reason"] == "explicit_stop"
    assert any(source["path"].endswith("0001.json") and source["status"] == "read"
               for source in data["sources"])
    assert snapshot(project) == before


def test_collect_empty_project_never_creates_metadata(tmp_path):
    project = tmp_path / "empty"
    project.mkdir()
    data = board.collect(project)
    assert data["roles"] == data["tasks"] == []
    assert data["receiver"]["recorded_status"] == "unknown"
    assert not (project / ".aris").exists()


@pytest.mark.parametrize("options", [(), ("--json",)])
def test_cli_terminal_and_json_are_read_only_even_for_empty_project(project, tmp_path, options):
    before = snapshot(project)
    result = invoke(project, *options)
    assert result.returncode == 0, result.stderr
    if options:
        assert json.loads(result.stdout)["tasks"][0]["record"] == str(project / "CURRENT.md")
    else:
        assert "experiment" in result.stdout
        assert "Acceptance: consult original record" in result.stdout
    assert snapshot(project) == before
    empty = tmp_path / "empty"
    empty.mkdir()
    result = invoke(empty, *options)
    assert result.returncode == 0, result.stderr
    assert not (empty / ".aris").exists()


def test_completed_submitted_idle_and_closed_wait_do_not_become_acceptance(project):
    root = project / ".aris/workbench"
    handle_path = root / "handles/experiment.json"
    handle = json.loads(handle_path.read_text(encoding="utf-8"))
    handle.update(active=False, receipt=str(project / "CURRENT.md"))
    write_json(handle_path, handle)
    data = board.collect(project)
    task, = data["tasks"]
    assert task["active"] is False
    assert task["delivery"] == "submitted"
    assert task["reports"][0]["outcome"] == "completed"
    assert task["reports"][0]["acceptance"] == "not_evaluated"
    assert data["roles"][0]["recorded_status"] == "idle"
    assert task["acceptance"] == "consult_original_record"
    rendered = board.render(data, "en")
    assert "wait closed" in rendered
    assert "Acceptance: consult original record" in rendered
    assert "PASS" not in rendered


def test_unknown_delivery_is_explicit_and_read_does_not_clear_attempt(project):
    root = project / ".aris/workbench"
    write_json(root / "bridge.json", {"attempts": {
        "experiment": {"status": "unknown", "pane_id": "w1:p1"}}, "delivered": {}})
    launch_path = root / "launch.json"
    launch = json.loads(launch_path.read_text(encoding="utf-8"))
    launch["roles"]["engineer"]["delivery"] = {"phase": "unknown"}
    write_json(launch_path, launch)
    before = snapshot(project)
    data = board.collect(project)
    assert data["tasks"][0]["pending_unknown"] is True
    assert next(role for role in data["roles"] if role["id"] == "engineer")["pending_unknown"] is True
    assert "Delivery needs inspection" in board.render(data, "en")
    assert snapshot(project) == before


def test_new_report_is_visible_to_next_collect(project):
    first = board.collect(project)
    write_json(project / ".aris/workbench/reports/experiment/0002.json", {
        "id": "experiment", "outcome": "reply", "message": "The artifact needs the original review.",
        "time": "2026-11-16T01:01:00+00:00", "acceptance": "not_evaluated",
    })
    second = board.collect(project)
    assert len(first["tasks"][0]["reports"]) == 1
    assert [report["outcome"] for report in second["tasks"][0]["reports"]] == ["completed", "reply"]


def test_unreadable_record_is_reported_without_repairing_it(project):
    path = project / ".aris/workbench/reports/experiment/0002.json"
    path.write_text("incomplete JSON", encoding="utf-8")
    before = snapshot(project)
    data = board.collect(project)
    assert any(source["path"].endswith("0002.json") and source["status"] == "unreadable"
               for source in data["sources"])
    assert any("0002.json" in warning for warning in data["warnings"])
    assert len(data["tasks"][0]["reports"]) == 1
    assert snapshot(project) == before


def test_loopback_api_recollects_changed_report_without_project_writes(project):
    with live_board(project) as (_, opener, base):
        before = snapshot(project)
        with opener.open(base + "/", timeout=5) as response:
            assert response.headers.get_content_type() == "text/html"
            assert b"SuperARIS" in response.read()
        with opener.open(base + "/api/board", timeout=5) as response:
            first = json.load(response)
            assert response.headers["Cache-Control"] == "no-store"
            assert response.headers.get_content_type() == "application/json"
        assert snapshot(project) == before
        path = project / ".aris/workbench/reports/experiment/0001.json"
        report = json.loads(path.read_text(encoding="utf-8"))
        report["message"] = "Owner clarified the artifact; acceptance remains pending."
        write_json(path, report)
        after_edit = snapshot(project)
        with opener.open(base + "/api/board", timeout=5) as response:
            second = json.load(response)
        assert first["tasks"][0]["reports"][0]["message"] != second["tasks"][0]["reports"][0]["message"]
        assert second["tasks"][0]["reports"][0]["message"] == report["message"]
        assert snapshot(project) == after_edit


def test_loopback_rejects_unknown_get_post_and_foreign_host_without_writes(project):
    before = snapshot(project)
    with live_board(project) as (_, opener, base):
        for request, status in [
            (Request(base + "/api/watch"), 404),
            (Request(base + "/.aris/workbench/launch.json"), 404),
            (Request(base + "/api/board", data=b'{"active":false}', method="POST",
                     headers={"Content-Type": "application/json"}), 501),
            (Request(base + "/api/board", headers={"Host": "example.invalid"}), 403),
        ]:
            with pytest.raises(HTTPError) as error:
                opener.open(request, timeout=5)
            try:
                assert error.value.code == status
            finally:
                error.value.close()
    assert snapshot(project) == before
