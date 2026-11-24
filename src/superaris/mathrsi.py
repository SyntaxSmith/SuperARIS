"""Resolve the opt-in MathRSI release and its original, authoritative resources."""
import os
from pathlib import Path

from .state import directory, read


def resolve_profile(project: Path, profile=None, repo=None, plugin=None) -> dict | None:
    saved = read(directory(project) / 'research-profile.json', {})
    if profile and saved.get('profile') and profile != saved['profile']:
        raise ValueError('Existing research profile cannot be changed by preparation')
    selected = profile or saved.get('profile')
    if selected is None:
        return None
    if selected == 'aris':
        return {'profile': 'aris'}
    if selected != 'mathrsi':
        raise ValueError(f'Unsupported research profile: {selected!r}')
    location = repo or saved.get('repo') or os.environ.get('MATHRSI_REPO')
    if not location:
        raise ValueError('MathRSI profile requires a MathRSI repository path')
    root = Path(location).expanduser().resolve()
    for name in ('research', 'prove', 'verify'):
        entry = root / f'base/skills/mathrsi-{name}/SKILL.md'
        if not entry.is_file():
            raise ValueError(f'MathRSI release entry is missing: {entry}')
    domain = plugin if plugin is not None else saved.get('plugin', '')
    if domain:
        candidate = Path(domain).expanduser()
        candidate = (candidate if candidate.is_absolute() else root / 'plugins' / candidate).resolve()
        if candidate.parent != (root / 'plugins').resolve() or not (candidate / 'README.md').is_file():
            raise ValueError(f'MathRSI plugin must be a domain directory under {root / "plugins"}: {domain}')
        domain = candidate.name
    resolved = {'profile': 'mathrsi', 'repo': str(root), 'plugin': domain or ''}
    if saved.get('profile') == 'mathrsi':
        if repo is not None and str(Path(saved['repo']).expanduser().resolve()) != resolved['repo']:
            raise ValueError('Existing MathRSI repository cannot be changed by preparation')
        if plugin is not None and saved.get('plugin', '') != resolved['plugin']:
            raise ValueError('Existing MathRSI plugin cannot be changed by preparation')
    return resolved


def resource_index(profile: dict, harness: str) -> dict[str, str]:
    root = Path(profile['repo'])
    # MathRSI's own workflows are shared; its bundled ARIS dependencies have a
    # separate Codex mirror. Never label the Claude ARIS copy as Codex-native.
    shared = root / 'base/skills'
    support = shared / 'skills-codex' if harness == 'codex' else shared
    entries = {p.parent.name: str(p) for p in sorted(shared.glob('mathrsi-*/SKILL.md'))}
    for name in ('research-wiki', 'proof-writer', 'proof-checker', 'lean-formalize'):
        path = support / name / 'SKILL.md'
        if not path.is_file():
            raise ValueError(f'MathRSI {harness} support entry is missing: {path}')
        entries[name] = str(path)
    if profile['plugin']:
        for path in sorted((root / 'plugins' / profile['plugin'] / 'skills').glob('*/SKILL.md')):
            entries[path.parent.name] = str(path)
    return entries


def prepare_guidance(profile: dict, role: str, run: Path, entries: dict[str, str]) -> Path:
    root = Path(profile['repo'])
    duties = {
        'main': 'Own the original mathematical specification, route decisions and final acceptance. Act as the single dispatcher of MathRSI stages; consume worker evidence before advancing the owning stage.',
        'engineer': 'Implement the assigned proof or computation obligation. For Lean, connect actual inputs to the original export and audit build/type/axioms; for computation, record exact domain, coverage, real outputs and reproducible commands. Return evidence to the owning mathematical obligation.',
        'writer': 'Develop mathematical arguments, derivations and literature connections, and assemble readable proof and handoff prose from accepted evidence. Distinguish proof obligations, hypotheses, imported results and computed facts; return substantive claims to the original owner for acceptance.',
    }.get(role, 'Recover your customized duties from the current binding and original owner handoff. Apply the same proof/computation evidence boundaries and return results to the owning mathematical obligation; the role name grants no dispatcher authority.')
    file = run / 'mathrsi.md'
    index = '\n'.join(f'- {name}: `{path}`' for name, path in entries.items())
    plugin = f"Read selected domain guidance `{root / 'plugins' / profile['plugin'] / 'README.md'}` and its indexed skills at the current stage's call site. " if profile['plugin'] else ''
    helpers = root / 'base'
    file.write_text(
        '# MathRSI mathematical research context\n\n' + duties + '\n\n'
        'The main owner reads mathrsi-research for stage selection. An assigned proof or computation worker reads the relevant portion of mathrsi-prove and its task-specific references; a worker assigned verification reads the applicable mathrsi-verify branch. Writers read the assigned argument/assembly/handoff stage. Customized roles follow the original owner scope. Read only the stage needed for the current obligation, not every workflow. An independent reviewer receives a separate fresh review packet under the original isolation contract; this role context does not establish independent review. Existing valid artifacts determine the entry stage; preparation starts no workflow. '
        'The original main owner is the single dispatcher. MathRSI owns mathematical research, proof/computation obligations and acceptance. The native SuperARIS project-agent owns workbench watch, report and transport; it does not create a second mathematical dispatcher. Child workflows and plugins return to their current caller; only that owner advances once. Standard ARIS support remains available.\n\n'
        f'For MathRSI wiki and current-context commands, use the helpers under `{helpers / "tools"}` and set `ARIS_REPO` to `{helpers}` for that command. Workbench watch/report commands use the installed SuperARIS interpreter from the packet. '
        'When a worker cannot access its host control socket, the owner can send a scoped assignment through the project: register a watch owned by the recipient, then report the assignment to that handle. Register the separate return handle with main as owner. '
        f'Read `{root / "docs/WORKSPACE.md"}` and `{root / "docs/PLUGIN_CONTRACT.md"}`. '
        + plugin +
        'The original per-problem wiki, specification, NEXT_SESSION/recovery and evidence remain authoritative. Reuse and update them through their owner; do not create a parallel ledger or reset old results. After compact/restart, recover the actual role and task from the current binding, read originals and relevant wiki entities, and reconcile real processes and artifacts. Read back changed facts from their original records; query_pack/navigation alone may omit relevant facts.\n\n'
        'A proof must connect the full original inputs and conclusion; a local lemma, finite search, model opinion or successful build establishes only its actual scope. One verified construction can prove existence; nonexistence requires full-domain coverage and the mathematical connection. Lean is used when required, not imposed on every computation. Preserve paused state, budgets, routes, fresh review and authorization.\n\n'
        f'## Original release skill index\n\n{index}\n\n'
        'These are actual release files, not native installation claims or snapshots. Read current sources and their relative resources; report inaccessible resources to the owner. MathRSI common mathrsi-* skills have no separate Codex mirror in this release; ARIS support above uses the host-specific mirror.\n', encoding='utf-8')
    return file
