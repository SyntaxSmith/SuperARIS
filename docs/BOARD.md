# Collaboration progress / 协作进度

Read the existing project's team, waits and reports without controlling its agents:

```sh
superaris board /path/to/project
superaris board /path/to/project --json
superaris board /path/to/project --open
```

`--open` starts a foreground, read-only browser view on `127.0.0.1` with an
automatically selected port. `--serve` prints the same local URL without opening
a browser; `--port 8765` chooses a port explicitly. Ctrl+C ends only this view,
leaving the original team and receiver unchanged. No model or native host needs
to run to inspect the records.

The browser automatically rereads saved records every two seconds. It highlights
the current handle's owner/worker, waiting item, latest delivery or reply, next
authorized action and original task/evidence pointers. Expand details for earlier
reports and metadata. The language control changes interface labels, retaining
original task text; `--lang en` or `--lang zh` overrides the saved UI preference
for this view without changing the project.

These are project records, not process liveness probes. A saved `idle` or receiver
`running` is not an online indicator. A `completed` report still needs the original
acceptance check; `submitted` is transport delivery, and closing a wait is not a
scientific PASS. Where no acceptance is supplied, follow the original record.
Unknown delivery remains visible and is never cleared or resent from the board.

The view reads the existing `launch.json`, handles, reports, bridge and receiver
records in `.aris/workbench/`. It does not parse arbitrary task Markdown, follow
query commands, read arbitrary evidence files or create a second task ledger.
There are no dispatch, cancellation, restart or editing actions. The server serves
only this selected project's board and JSON data; it has no file-browsing endpoint.

中文：运行 `superaris board 项目目录` 查看终端摘要，加 `--open` 打开暖米色浏览器
协作视图，或用 `--serve` 仅显示本地地址。页面每两秒自动读取项目记录，中英文按钮只切
界面标签，不翻译任务正文、不修改项目语言。活跃等待、最新报告与下一授权动作优先展示，
完整元数据可展开；记录状态不是在线状态，报告完成／已投递不等于验收通过。未知投递仍需
原路径核实，板上没有重发或控制操作。Ctrl+C 只关闭本视图，不停止原团队或收件器。

See [registered results and memory](RESULTS_AND_MEMORY.md) for the actual
`watch` → `report` → original acceptance → `acknowledge` path. A bounded
clarification can target another already-bound role rather than always going
through main; it does not transfer final acceptance or shared-file ownership.

## Terminal refresh and Herdr tab / 终端刷新与 Herdr 标签页

```sh
superaris board /path/to/project --watch
superaris board /path/to/project --tab
```

`--watch` rereads the same project records every two seconds and redraws only when
records change. It works with either host; Ctrl+C stops only this foreground view.
The terminal prioritizes active waits, latest replies, unknown delivery and the next
authorized action, with a compact team summary.

`--tab` checks the existing Herdr project's main PID, effective directory and native
identity through the original owner guard, then creates a separate **Collaboration
progress** tab in that pane's workspace. It queues the same installed Python's
`board --watch` command there, without focusing it or splitting the three original
panes. Each explicit invocation creates a new tab; switch to the returned tab in
Herdr. No team, model, receiver or project record is created or changed. It never
installs Herdr or restarts a server. If the original owner is absent or changed,
use `--watch` or `--open` to read the records. Orca keeps these terminal/browser
options; `--tab` is Herdr-only. Windows command text uses PowerShell.

中文：`--watch` 每两秒读原记录，仅有变化时刷新终端；`--tab` 核实已存在的
Herdr 项目负责人后，在同一工作空间新开「协作进度」独立标签页，不挤占三窗格、
不抢焦点、不启动模型、不改任务或收件器。切到返回的标签页即可查看；每次显式调用
都会新开一页。关闭标签页或 Ctrl+C 只退出视图。负责人不在原位置时可用终端／浏览器
读记录，不会为看进度自动重建团队。
