import json
from pathlib import Path
import pytest
from superaris.context import prepare_context
from superaris.mathrsi import resolve_profile
from tests.support import make_aris_repo
@pytest.fixture
def release(tmp_path):
    """Faithful release layout: common MathRSI, host ARIS mirror, domain skills."""
    root = tmp_path / 'math-rsi'
    paths = [f'base/skills/mathrsi-{name}/SKILL.md' for name in ('research', 'prove', 'verify')]
    for host in ('base/skills', 'base/skills/skills-codex'):
        paths.extend(f'{host}/{name}/SKILL.md' for name in ('research-wiki', 'proof-writer', 'proof-checker', 'lean-formalize'))
    paths.extend(('plugins/ecc/README.md', 'plugins/ecc/skills/mathrsi-ecc/SKILL.md', 'docs/WORKSPACE.md', 'docs/PLUGIN_CONTRACT.md'))
    for relative in paths:
        file = root / relative
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(f'# Synthetic release resource: {relative}\n')
    return root


@pytest.mark.parametrize('harness,role', [('codex', 'engineer'), ('claude', 'main'), ('agy', 'writer'), ('codex', 'custom-math')])
def test_release_context(tmp_path, monkeypatch, harness, role, release):
    monkeypatch.setenv('HOME', str(tmp_path / 'home'))
    project = tmp_path / 'problem'
    project.mkdir()
    marker = project / '.aris/workbench/research-profile.json'
    marker.parent.mkdir(parents=True)
    profile = resolve_profile(project, 'mathrsi', release, 'ecc')
    marker.write_text(json.dumps(profile))
    result = prepare_context(project, role, harness, 'Continue original obligation', ['mathrsi-prove'], repo=make_aris_repo(tmp_path / 'aris'))
    guidance = Path(result['mathrsi_guidance']).read_text()
    for text in ('single dispatcher', 'original per-problem wiki', 'full-domain coverage', 'native SuperARIS project-agent'):
        assert text in guidance
    assert result['skill_index']['mathrsi-prove'] == str(release / 'base/skills/mathrsi-prove/SKILL.md')
    expected = 'base/skills/skills-codex' if harness == 'codex' else 'base/skills'
    assert result['skill_index']['proof-checker'] == str(release / expected / 'proof-checker/SKILL.md')
    assert 'mathrsi-ecc' in result['mathrsi_skill_index']
    assert result['mathrsi_skill_index']['mathrsi-prove'] in result['skill_files']
    assert result['mathrsi_skill_index']['mathrsi-verify'] not in result['skill_files']
    assert '- mathrsi-verify:' not in Path(result['packet']).read_text()
    for key in ('packet', 'navigation', 'role_file', 'recovery_file'):
        assert result['mathrsi_guidance'] in Path(result[key]).read_text()
    assert json.loads(marker.read_text()) == profile
    startup = Path(result['startup_entry']).read_text()
    assert '.aris/workbench/RECOVERY.md' in startup
    assert 'mathrsi.md' in startup
    assert 'LATEST_PREPARED.md' in (project / '.aris/workbench/RECOVERY.md').read_text()
    assert 'not every workflow' in guidance
    assert 'separate fresh review packet' in guidance

def test_default_and_profile_validation(tmp_path, monkeypatch, release):
    assert resolve_profile(tmp_path) is None
    monkeypatch.setenv('MATHRSI_REPO', str(release))
    assert resolve_profile(tmp_path, 'mathrsi')['repo'] == str(release)
    with pytest.raises(ValueError, match='plugin'):
        resolve_profile(tmp_path, 'mathrsi', release, '../docs')
    with pytest.raises(ValueError, match='missing'):
        resolve_profile(tmp_path, 'mathrsi', tmp_path)


def test_unprofiled_aris_context_remains_standard(tmp_path, monkeypatch):
    monkeypatch.setenv('HOME', str(tmp_path / 'home'))
    project = tmp_path / 'standard'
    project.mkdir()
    result = prepare_context(project, 'main', 'codex', 'Original task', [], repo=make_aris_repo(tmp_path / 'aris'))
    assert 'mathrsi_guidance' not in result
    assert not (project / '.aris/workbench/research-profile.json').exists()
    assert 'MathRSI' not in Path(result['packet']).read_text()
