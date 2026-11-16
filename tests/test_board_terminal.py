"""Foreground terminal view and explicitly anchored Herdr tab; no models."""
import json
import sys

import pytest

from superaris import board, cli
from superaris.client import HerdrError
from tests.test_board import project, snapshot, write_json  # noqa: F401


def test_display_modes_stay_mutually_exclusive(project):
    for flag in ('--watch', '--tab', '--json', '--open', '--serve'):
        args = cli.parser().parse_args(['board', str(project), flag])
        assert getattr(args, flag[2:]) is True
    with pytest.raises(SystemExit):
        cli.parser().parse_args(['board', str(project), '--watch', '--tab'])


def test_watch_refreshes_changed_records_without_generated_at_churn(project, monkeypatch, capsys):
    before = snapshot(project)
    iterations = []
    def tick(seconds):
        assert seconds == 2
        iterations.append(1)
        if len(iterations) == 2:
            path = project / '.aris/workbench/reports/experiment/0001.json'
            report = json.loads(path.read_text(encoding='utf-8'))
            report['outcome'], report['message'] = 'blocked', 'Missing remote evidence; ask the original owner.'
            write_json(path, report)
        elif len(iterations) == 3:
            raise KeyboardInterrupt
    monkeypatch.setattr(board.time, 'sleep', tick)
    assert board.watch(project, 'en') == 0
    output = capsys.readouterr().out
    assert output.count('SuperARIS ·') == 2  # second unchanged collect doesn't redraw
    assert 'blocked · Missing remote evidence' in output
    assert 'Next:' in output and 'original acceptance' in output
    # Only the test's explicit report edit changed any project bytes.
    after = snapshot(project)
    assert [p for p in before if before[p] != after[p]] == ['.aris/workbench/reports/experiment/0001.json']


@pytest.fixture
def tab_transport(project, monkeypatch):
    root = project / '.aris/workbench/launch.json'
    bound = json.loads(root.read_text(encoding='utf-8'))
    bound.update(workspace_id='w7', session='explicit-project-session')
    bound['roles']['main'].update(pane_id='w7:p9', pid=123, native_session_id='original-native')
    write_json(root, bound)
    calls = []
    class Transport:
        changed = False
        def __init__(self, session, binary):
            assert (session, binary) == ('explicit-project-session', 'actual-herdr')
        def run(self, *args):
            calls.append(args)
            assert args[:3] == ('pane', 'run', 'w7:p22')
            assert '--watch' in args[3] and sys.executable in args[3]
            return 'Command queued'  # official pane.run is text, not JSON
        def json(self, *args):
            calls.append(args)
            if args[:2] == ('agent', 'get'):
                return {'agent': {'pane_id': 'w7:p9', 'agent': 'codex', 'agent_status': 'idle',
                                  'agent_session': {'value': 'original-native'}}}
            if args[:2] == ('pane', 'process-info'):
                return {'process_info': {'foreground_processes': [{'pid': 456 if self.changed else 123,
                    'cwd': str(project.parent), 'argv': ['codex', '--cd', str(project)]}]}}
            if args[:2] == ('pane', 'get'):
                return {'pane': {'pane_id': 'w7:p9', 'workspace_id': 'w7'}}
            if args[:2] == ('workspace', 'get'):
                assert args == ('workspace', 'get', 'w7')
                return {'workspace': {'workspace_id': 'w7'}}
            if args[:2] == ('tab', 'create'):
                assert args[args.index('--workspace') + 1] == 'w7' and '--no-focus' in args
                return {'tab': {'tab_id': 'w7:t8'}, 'root_pane': {'pane_id': 'w7:p22'}}
            if args[:2] == ('pane', 'run'):
                assert args[2] == 'w7:p22' and '--watch' in args[3]
                assert sys.executable in args[3] and 'superaris' in args[3]
                return {'queued': True}
            raise AssertionError(args)
    monkeypatch.setattr('superaris.client.Herdr', Transport)
    return root, calls, Transport


def test_tab_uses_verified_existing_workspace_and_only_runs_new_view(project, tab_transport):
    _, calls, _ = tab_transport
    before = snapshot(project)
    result = board.open_tab(project, 'actual-herdr', 'en')
    assert result['tab_id'] == 'w7:t8' and result['pane_id'] == 'w7:p22'
    from superaris.platform import command_line
    assert result['admitted']
    assert result['command'] == command_line([sys.executable, '-m', 'superaris', 'board', str(project), '--watch', '--lang', 'en'])
    assert snapshot(project) == before
    assert [c[:2] for c in calls] == [('agent', 'get'), ('pane', 'process-info'), ('pane', 'get'),
                                    ('workspace', 'get'), ('tab', 'create'), ('pane', 'run')]


def test_tab_refuses_changed_owner_before_creating_anything(project, tab_transport):
    _, calls, transport = tab_transport
    transport.changed = True
    before = snapshot(project)
    with pytest.raises(HerdrError, match='process changed'):
        board.open_tab(project, 'actual-herdr')
    assert not any(c[:2] == ('tab', 'create') for c in calls)
    assert snapshot(project) == before


def test_tab_refuses_orca_or_missing_owner_without_native_calls(project, tab_transport):
    path, calls, _ = tab_transport
    bound = json.loads(path.read_text(encoding='utf-8'))
    bound['host'] = 'orca'
    write_json(path, bound)
    with pytest.raises(ValueError, match='Orca'):
        board.open_tab(project, 'actual-herdr')
    bound['host'] = 'herdr'
    bound['roles']['main'].pop('pid')
    write_json(path, bound)
    with pytest.raises(ValueError, match='owner identity'):
        board.open_tab(project, 'actual-herdr')
    assert not calls
