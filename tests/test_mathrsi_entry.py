"""MathRSI entry selects local context while preserving native recovery."""
import json
from pathlib import Path

import pytest

from superaris import cli, runtime, wizard
from superaris.state import directory, write


def release(tmp_path):
    root = tmp_path / 'math-rsi'
    for name in ('research', 'prove', 'verify'):
        skill = root / f'base/skills/mathrsi-{name}/SKILL.md'
        skill.parent.mkdir(parents=True)
        skill.write_text(name)
    plugin = root / 'plugins/combinatorics/README.md'
    plugin.parent.mkdir(parents=True)
    plugin.write_text('domain')
    return root


def test_plan_profile_is_offline_and_canonical_arguments_keep_configuration(tmp_path):
    project = tmp_path / 'project'
    project.mkdir()
    repo = release(tmp_path)
    args = cli.parser().parse_args(['start', str(project), '--plan', '--profile', 'mathrsi',
                                    '--mathrsi-repo', str(repo), '--mathrsi-plugin', 'combinatorics'])
    plan = cli.make_plan(args)
    assert plan['research_profile'] == {'profile': 'mathrsi', 'repo': str(repo), 'plugin': 'combinatorics'}
    assert '--mathrsi-plugin' in args.start_arguments
    assert not (project / '.aris').exists()


def test_mathrsi_alias_defaults_new_project_but_preserves_existing_aris(tmp_path, monkeypatch, capsys):
    project = tmp_path / 'project'
    project.mkdir()
    repo = release(tmp_path)
    monkeypatch.setenv('MATHRSI_REPO', str(repo))
    assert cli.mathrsi_main(['start', str(project), '--plan']) == 0
    assert json.loads(capsys.readouterr().out)['research_profile']['profile'] == 'mathrsi'
    assert not (project / '.aris').exists()
    write(directory(project) / 'launch.json', {'preset': 'codex', 'session': 'aris', 'roles': {}})
    assert cli.mathrsi_main(['start', str(project), '--plan']) == 0
    assert json.loads(capsys.readouterr().out)['research_profile'] is None


@pytest.mark.parametrize("default_profile,mode", [("aris", "2"), ("mathrsi", "")])
def test_new_wizard_selects_mathrsi_without_writing(tmp_path, monkeypatch, default_profile, mode):
    monkeypatch.delenv("MATHRSI_REPO", raising=False)
    repo = release(tmp_path)
    project = tmp_path / 'new-project'
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(wizard, 'capabilities', lambda: {'herdr': 'herdr', 'orca': None,
                         'codex': 'codex', 'claude': None, 'agy': None, 'brew': None})
    answers = iter(['2', str(project), mode, str(repo), 'combinatorics', '1', '', '', '', '', '', '1'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(answers))
    selected = wizard.run(default_profile=default_profile)
    args = cli.parser().parse_args(selected.arguments)
    assert args.profile == 'mathrsi'
    assert args.mathrsi_repo == repo
    assert args.mathrsi_plugin == 'combinatorics'
    assert selected.create_project
    assert not project.exists()


def test_cancel_mathrsi_wizard_never_creates_project(tmp_path, monkeypatch):
    project = tmp_path / 'cancelled'
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(wizard, 'capabilities', lambda: {'herdr': 'herdr', 'orca': None,
                         'codex': 'codex', 'claude': None, 'agy': None, 'brew': None})
    answers = iter(['2', str(project), 'q'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(answers))
    with pytest.raises(wizard.Cancelled):
        wizard.run(default_profile='mathrsi')
    assert not project.exists()


def test_pending_mathrsi_recovery_keeps_original_arguments(tmp_path, monkeypatch):
    project = tmp_path / 'project'
    project.mkdir()
    repo = release(tmp_path)
    original = ['start', str(project), '--profile', 'mathrsi', '--mathrsi-repo', str(repo)]
    write(directory(project) / 'research-profile.json', {'profile': 'mathrsi', 'repo': str(repo), 'plugin': ''})
    write(directory(project) / 'launch.json', {'session': 'original', 'pending_start': {
        'roles': [{'role': 'main', 'harness': 'codex'}], 'arguments': original}, 'roles': {}})
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(wizard, 'capabilities', lambda: {'herdr': 'herdr', 'orca': None,
                         'codex': 'codex', 'claude': None, 'agy': None, 'brew': None})
    answers = iter(['2', str(project), '1', '1'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(answers))
    before = (directory(project) / 'launch.json').read_text()
    assert wizard.run().arguments == original
    assert (directory(project) / 'launch.json').read_text() == before


def test_existing_aris_cannot_be_converted_by_explicit_profile(tmp_path):
    project = tmp_path / 'project'
    project.mkdir()
    write(directory(project) / 'launch.json', {'session': 'aris', 'roles': {}})
    args = cli.parser().parse_args(['start', str(project), '--plan', '--profile', 'mathrsi',
                                    '--mathrsi-repo', str(release(tmp_path))])
    with pytest.raises(ValueError, match='cannot be converted'):
        cli.make_plan(args)
    assert not (directory(project) / 'research-profile.json').exists()


from tests.test_mathrsi_context import release as mathrsi_release
from tests.test_orca_runtime import setup as orca_setup
from tests.test_rex_runtime import rex_project


def test_confirmed_mathrsi_start_saves_marker_before_context_and_reuses_native_team(orca_setup, monkeypatch):
    project, client, args, _, calls, _ = orca_setup
    args.profile = 'mathrsi'
    args.mathrsi_repo = release(project.parent)
    args.mathrsi_plugin = 'combinatorics'
    plan = cli.make_plan(args)
    titles = []
    client.rename_terminal = lambda handle, title: titles.append((handle, title)) or {"ok": True}
    original_prepare = runtime.prepare_context

    def prepared(*values, **options):
        marker = json.loads((directory(project) / 'research-profile.json').read_text())
        assert marker == plan['research_profile']
        return original_prepare(*values, **options)

    monkeypatch.setattr(runtime, 'prepare_context', prepared)
    runtime.start(plan, args)
    assert len(client.launches) == len(calls) == len(titles) == 3
    assert titles[0][1] == "MathRSI · Research lead · Codex"
    assert titles[1][1] == "MathRSI · Construction & computation · Codex"
    assert titles[2][1] == "MathRSI · Proof & derivation · Codex"
    # Reentry uses the persisted mode and each original native handle.
    original_handles = {key: value['pane_id'] for key, value in runtime.binding(project)['roles'].items()}
    args.profile = args.mathrsi_repo = args.mathrsi_plugin = None
    runtime.start(cli.make_plan(args), args)
    assert len(client.launches) == len(calls) == len(titles) == 3
    assert {key: value['pane_id'] for key, value in runtime.binding(project)['roles'].items()} == original_handles


def test_optional_orca_title_error_does_not_change_native_success(orca_setup):
    from superaris.client import HerdrError
    project, client, args, _, _, _ = orca_setup
    args.profile = 'mathrsi'
    args.mathrsi_repo = release(project.parent)
    def unsupported(*values):
        raise HerdrError('title unsupported')
    client.rename_terminal = unsupported
    result = runtime.start(cli.make_plan(args), args)
    assert [action['action'] for action in result['actions']] == ['started'] * 3
    assert all(role['title_warning'] == 'title unsupported' for role in runtime.binding(project)['roles'].values())


def test_rex_mathrsi_start_and_reconnect_preserve_profile_and_native_owner(rex_project, mathrsi_release):
    project, client, start = rex_project
    result, _ = start('--profile', 'mathrsi', '--mathrsi-repo', str(mathrsi_release), '--only-role', 'main')
    assert result['host'] == 'rex'
    original = result['roles']['main']
    profile = runtime.binding(project)['research_profile']
    assert profile == {'profile': 'mathrsi', 'repo': str(mathrsi_release), 'plugin': ''}
    assert json.loads((directory(project) / 'research-profile.json').read_text()) == profile
    packet = Path(original['context']['packet']).read_text()
    assert 'Workbench host: rex' in packet and 'Required MathRSI profile guidance' in packet
    create, = client.calls('session.create')
    assert create['label'] == f'MathRSI {project.name}'
    assert client.read()['blocks'][original['pane_id']]['label'] == 'Research lead · Codex'

    reconnected, _ = start('--only-role', 'main')
    assert [action['action'] for action in reconnected['actions']] == ['reused']
    assert reconnected['roles']['main']['pane_id'] == original['pane_id']
    assert len(client.calls('session.create')) == len(client.calls('block.event')) == 1


def test_interactive_confirmation_persists_profile_before_failed_launch(tmp_path, monkeypatch):
    project = tmp_path / 'project'
    project.mkdir()
    repo = release(tmp_path)
    arguments = ['start', str(project), '--profile', 'mathrsi', '--mathrsi-repo', str(repo)]
    monkeypatch.setattr(cli.sys.stdin, 'isatty', lambda: True)
    monkeypatch.setattr(cli.sys.stdout, 'isatty', lambda: True)
    monkeypatch.setattr(wizard, 'run', lambda: wizard.Selection(arguments, False, ui_language='en'))
    def fail(plan, args):
        assert json.loads((directory(project) / 'research-profile.json').read_text()) == plan['research_profile']
        assert runtime.binding(project)['research_profile'] == plan['research_profile']
        raise RuntimeError('host unavailable before runtime start')
    monkeypatch.setattr(wizard, 'launch', fail)
    assert cli.main([]) == 1
    resumed = cli.make_plan(cli.parser().parse_args(['start', str(project), '--plan']))
    assert resumed['research_profile'] == {'profile': 'mathrsi', 'repo': str(repo), 'plugin': ''}


def test_stale_mathrsi_plan_never_overwrites_existing_aris_binding(tmp_path, monkeypatch):
    project = tmp_path / 'project'
    project.mkdir()
    args = cli.parser().parse_args(['start', str(project), '--profile', 'mathrsi',
                                    '--mathrsi-repo', str(release(tmp_path))])
    plan = cli.make_plan(args)
    old = {'session': 'existing', 'roles': {'main': {'pane_id': 'original', 'harness': 'codex'}}}
    write(directory(project) / 'launch.json', old)
    before = (directory(project) / 'launch.json').read_bytes()
    monkeypatch.setattr(runtime, 'client_for_binding', lambda *a, **k: pytest.fail('stale plan must fail before host access'))
    with pytest.raises(ValueError, match='cannot be converted'):
        runtime.start(plan, args)
    assert (directory(project) / 'launch.json').read_bytes() == before
    assert not (directory(project) / 'research-profile.json').exists()
