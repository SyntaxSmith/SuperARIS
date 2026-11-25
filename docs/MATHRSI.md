# MathRSI Workbench

Keep the problem in its own directory and point the workbench at a local [MathRSI checkout](https://github.com/lisresearchgroup/math-rsi). The checkout supplies the original workflows, relative references and domain plugins. The task directory holds the proof, computations and recovery notes.

After installing SuperARIS, run `mathrsi` in a terminal to open the wizard. The checkout path can be entered in the wizard or supplied through `MATHRSI_REPO`. With pipx, install the package once to expose both commands. Running `superaris` also offers MathRSI when starting a new project.

For an existing problem directory and a local checkout:

```sh
mathrsi start ./my-problem --mathrsi-repo /path/to/math-rsi --mathrsi-plugin ecc --host herdr --plan
```

Remove `--plan` to start the selected team. For a new Orca workbench, choose `--host orca`. Use `--only-role main` for a short problem. Omit the plugin for general mathematics. From either entry, opening a bound project recovers its original workbench, roles and mathematical profile.

| Role | Mathematical responsibility |
| --- | --- |
| Research lead (`main`) | Own the question and the task wiki, dispatch obligations, read evidence and decide the next stage. |
| Construction & computation (`engineer`) | Produce a construction, an executable check or a counterexample in the assigned directory. |
| Proof & derivation (`writer`) | Derive the argument from the original hypotheses and state which conclusions it supports. |

A role can use the selected native client. For independent review, follow MathRSI's reviewer instructions. [MathRSI task workspace](https://github.com/lisresearchgroup/math-rsi/blob/main/docs/WORKSPACE.md) · [MathRSI domain plugins](https://github.com/lisresearchgroup/math-rsi/blob/main/docs/PLUGIN_CONTRACT.md).

### Dispatch from a sandboxed agent

A main session with project-file access can use the installed command from its packet even when it cannot operate the host's terminal socket. Register a return watch owned by main, then a separate assignment watch owned by the worker. Both can point at the same existing problem statement. Report the assignment to the worker's watch, using its exact ID. The worker writes the requested output and reports back to the return watch. Main reads the output, checks it against the problem, updates its original notes and acknowledges the return watch. The existing receiver delivers notifications or automatic follow-up according to host, client and input ownership. [Receiving results](RESULTS_AND_MEMORY.md).
