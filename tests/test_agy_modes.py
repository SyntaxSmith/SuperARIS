"""Native-model choices without changing roles, effort, or existing owners."""
import json

import pytest

from superaris import cli, ui, wizard
from superaris.runtime import _native_args
from tests.test_windows_runtime import portable_team  # noqa: F401
from tests.test_aris_workbench import start


MODES = [("6", "gemini-pro-orchestrator"), ("7", "gemini-pro-orchestrator-argon"),
         ("8", "gemini-4-hydrogen-xhigh")]


@pytest.mark.parametrize("role", ["main", "engineer", "writer"])
@pytest.mark.parametrize("number,model", MODES)
def test_new_shortcuts_keep_previous_selection_for_each_role(monkeypatch, role, number, model):
    answers = iter([number, ""])
    monkeypatch.setattr("builtins.input", lambda _: next(answers))
    assert wizard.select_model(role, "agy", None) == model
    assert wizard.select_model(role, "agy", model) == model


def test_native_display_name_is_one_argument_and_has_no_forced_effort(tmp_path):
    name = "Orchestrator (Carbon)"
    args = cli.parser().parse_args(["start", str(tmp_path), "--role", "main=agy", "--model", "main=" + name])
    model = next(r for r in cli.make_plan(args)["roles"] if r["role"] == "main")["model"]
    assert model == name
    assert _native_args("agy", tmp_path, "Read the original packet", model) == [
        "--model", name, "--prompt-interactive", "Read the original packet"]
    assert "--effort" not in _native_args("agy", tmp_path, None, None)


@pytest.mark.parametrize("number,model", MODES)
def test_new_model_native_argv_then_reentry_keeps_original_team(portable_team, number, model):
    project, fake = portable_team
    initial = start(project, fake, "--role", "main=agy", "--only-role", "main", "--model", "main=" + model)
    assert initial.returncode == 0, initial.stderr
    before = json.loads(initial.stdout)
    assert set(before["roles"]) == {"main"}
    assert before["roles"]["main"]["requested_model"] == model
    state = json.loads(fake["state"].read_text())
    launches = [a for a in state["commands"] if a[:2] == ["agent", "start"]]
    assert len(launches) == 1
    assert launches[0][launches[0].index("--model") + 1] == model
    assert "--effort" not in launches[0]
    result = start(project, fake, "--model", "main=another-requested-mode")
    assert result.returncode == 0, result.stderr
    after = json.loads(result.stdout)
    assert set(after["roles"]) == {"main"}
    assert after["roles"]["main"]["requested_model"] == model
    assert after["roles"]["main"]["pid"] == before["roles"]["main"]["pid"]
    commands = json.loads(fake["state"].read_text())["commands"]
    assert sum(a[:2] == ["agent", "start"] for a in commands) == 1
    assert not any(a[:2] == ["agent", "prompt"] for a in commands)
