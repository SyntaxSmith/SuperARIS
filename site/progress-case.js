(function () {
  "use strict";

  var isStandalone = !window.SuperARISDemo && Boolean(document.getElementById("standalone-board-root"));

  var UI = {
    zh: {
      tabTeam: "团队工作台",
      tabProgress: "协作进度",
      openBrowser: "在浏览器打开 ↗",
      openBrowserShort: "浏览器打开 ↗",
      backToDemo: "← 返回工作台演示",
      boardBadge: "协作进度",
      demoSnapBadge: "交互示例 · 阶段快照",
      projectTitle: "sparse-attn-paper — 查询感知稀疏路由",
      projectRoot: "~/research/sparse-attn-paper",
      termFlowTitle: "协作等待与交付链",
      termRolesTitle: "常驻角色分工 (3)",
      termFilesTitle: "项目记录与产物",
      termFootNote: "Herdr 内看终端摘要，浏览器里看完整记录。",
      standaloneNote: "示例说明：本页展示首页演示打开时的阶段快照（示例数据，未连接本地真实 Agent）；“已报告完成·待核验”不等于通过验收，正式验收见原记录文件。",
      waitsOn: "等待",
      clarifyWith: "向其确认",
      archivedFrom: "归档自",
      waitingFor: "等待事项",
      nextAuth: "下一步",
      deliverable: "交付物",
      recordFile: "原记录",
      inputMode: "接续方式",
      writeScope: "授权写域",
      details: "记录详情",
      hideDetails: "收起详情",
      expandHistory: "展开全部 {n} 条记录 · 早期：{early}",
      collapseHistory: "收起历史记录（{n}）",
      themeWarm: "暖米",
      themeDark: "深色",
      reviewToggle: "后台独立审阅",
      mcpHeading: "⚡ 独立后台审阅 · 全新上下文 MCP（非常驻第 4 角色）",
      roles: {
        main: { name: "主会话", harness: "CC", model: "已配置模型", scope: "./（项目根）", mode: "人工掌控 · 可见通知打开核验" },
        engineer: { name: "工程", harness: "Codex", model: "已配置模型", scope: "experiments/ , results/", mode: "任务派发 · 跑实验与脚本核查" },
        writer: { name: "研究与写作", harness: "AGY", model: "Gemini 4 Argon", scope: "notes/ , paper/", mode: "可见通知 · 读回复与正文主写" }
      },
      phaseTabs: [
        { p: 0, label: "01 启动就绪" },
        { p: 2, label: "02 方案定稿" },
        { p: 3, label: "03 并行派工" },
        { p: 6, label: "04 结果送达" },
        { p: 7, label: "04c 指标提问" },
        { p: 8, label: "04d 工程回复" },
        { p: 9, label: "05a 审稿待核" },
        { p: 10, label: "05b 主控已核验" },
        { p: 11, label: "06 续接下一步" }
      ]
    },
    en: {
      tabTeam: "Team Workbench",
      tabProgress: "Progress",
      openBrowser: "Open in browser ↗",
      openBrowserShort: "Browser ↗",
      backToDemo: "← Back to workbench demo",
      boardBadge: "Collaboration Board",
      demoSnapBadge: "Interactive Demo · Stage Snapshot",
      projectTitle: "sparse-attn-paper — Query-Aware Sparse Routing",
      projectRoot: "~/research/sparse-attn-paper",
      termFlowTitle: "Active Waits & Delivery Chain",
      termRolesTitle: "Resident Team Roles (3)",
      termFilesTitle: "Project Records & Artifacts",
      termFootNote: "A terminal summary in Herdr; full records in the browser.",
      standaloneNote: "Demo snapshot: Illustrative stage data from the homepage walkthrough (not connected to a live local agent). 'Reported completed' awaits verification in the original record.",
      waitsOn: "waiting on",
      clarifyWith: "clarifying with",
      archivedFrom: "from",
      waitingFor: "Waiting for",
      nextAuth: "Next",
      deliverable: "Deliverable",
      recordFile: "Task record",
      inputMode: "Follow-up",
      writeScope: "Write scope",
      details: "Details",
      hideDetails: "Hide details",
      expandHistory: "Show all {n} reports · earlier: {early}",
      collapseHistory: "Hide history ({n})",
      themeWarm: "Warm",
      themeDark: "Dark",
      reviewToggle: "Background review",
      mcpHeading: "⚡ Background reviewer · Fresh MCP context (not a 4th resident role)",
      roles: {
        main: { name: "Main", harness: "CC", model: "configured model", scope: "./ (project root)", mode: "Human-owned · Visible notice to inspect" },
        engineer: { name: "Engineer", harness: "Codex", model: "configured model", scope: "experiments/ , results/", mode: "Scoped dispatch · Benchmarks & checks" },
        writer: { name: "Research & Writing", harness: "AGY", model: "Gemini 4 Argon", scope: "notes/ , paper/", mode: "Visible notice · Reads reply & drafts prose" }
      },
      phaseTabs: [
        { p: 0, label: "01 Launch" },
        { p: 2, label: "02 Plan Locked" },
        { p: 3, label: "03 Dispatched" },
        { p: 6, label: "04 Results In" },
        { p: 7, label: "04c Unit Question" },
        { p: 8, label: "04d Clarified" },
        { p: 9, label: "05a Audit Pending" },
        { p: 10, label: "05b Main Verified" },
        { p: 11, label: "06 Next 64k Step" }
      ]
    }
  };

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "className") node.className = v;
        else if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) node.setAttribute(k, "");
        else node.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      appendSafe(node, arguments[i]);
    }
    return node;
  }

  function appendSafe(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) appendSafe(parent, child[i]);
    } else if (child && child.nodeType) {
      parent.appendChild(child);
    } else {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }

  /* Map SuperARISDemo clock state -> discrete causal phase (0..11) */
  function deriveFromDemo(ds) {
    var sIdx = Number(ds.sceneIndex || 0);
    var rc = ds.revealedCounts || { main: 0, engineer: 0, writer: 0 };
    var dur = Number(ds.sceneDuration || 6400);
    var elapsed = Number(ds.elapsedMs || 0);
    var lang = ds.lang === "zh" || ds.language === "zh" ? "zh" : "en";
    var theme = document.body.dataset.theme === "dark" || ds.theme === "dark" ? "dark" : "warm";
    var showReview = ds.showReview !== false;

    if (sIdx === 0) {
      return { phaseNum: 0, lang: lang, theme: theme, showReview: showReview, sceneIndex: 0, writerFixed: false, hasTex: false, hasTable: false };
    }
    if (sIdx === 1) {
      return { phaseNum: rc.main >= 3 ? 2 : 1, lang: lang, theme: theme, showReview: showReview, sceneIndex: 1, writerFixed: false, hasTex: false, hasTable: false };
    }
    if (sIdx === 2) {
      return { phaseNum: 3, lang: lang, theme: theme, showReview: showReview, sceneIndex: 2, writerFixed: false, hasTex: false, hasTable: false, dispatchedEng: rc.main >= 2 || elapsed >= dur * 0.4, dispatchedWriter: rc.main >= 3 || elapsed >= dur * 0.6 };
    }
    if (sIdx === 3) {
      var hasTex = rc.writer >= 2;
      var hasTable = rc.engineer >= 3;
      var pNum = 4;
      if (!hasTable && hasTex) pNum = 5;
      else if (hasTable && (!hasTex || elapsed < dur * 0.68)) pNum = 6;
      else if (hasTable && hasTex && elapsed < dur * 0.84) pNum = 7;
      else if (hasTable && hasTex) pNum = 8;
      return { phaseNum: pNum, lang: lang, theme: theme, showReview: showReview, sceneIndex: 3, writerFixed: false, hasTex: hasTex, hasTable: hasTable };
    }
    if (sIdx === 4) {
      var verified = rc.main >= 3;
      return { phaseNum: verified ? 10 : 9, lang: lang, theme: theme, showReview: showReview, sceneIndex: 4, writerFixed: rc.writer >= 1 || verified, hasTex: true, hasTable: true };
    }
    return { phaseNum: 11, lang: lang, theme: theme, showReview: showReview, sceneIndex: 5, writerFixed: true, hasTex: true, hasTable: true };
  }

  function snapshotFromPhase(phaseNum, lang, theme, showReview, extra) {
    var p = Math.max(0, Math.min(11, Number(phaseNum) || 0));
    var ex = extra || {};
    var zh = lang === "zh";
    var phaseIds = [
      "launch", "discuss-co", "discuss-locked", "dispatch",
      "exec-running", "tex-arrived", "table-arrived", "clarify-ask",
      "clarify-reply", "audit-pending", "audit-verified", "handoff"
    ];
    var stageBadges = zh
      ? ["01/06 启动就绪", "02/06 共同立意", "02/06 方案定稿", "03/06 并行派工", "04/06 并行执行", "04/06 初稿已到", "04/06 实验送达", "04/06 指标提问", "04/06 澄清已回", "05/06 交叉核验", "05/06 主控已核验", "06/06 续接下一步"]
      : ["01/06 Launch", "02/06 Co-Design", "02/06 Plan Locked", "03/06 Dispatched", "04/06 Running", "04/06 Draft In", "04/06 Table In", "04/06 Unit Check", "04/06 Clarified", "05/06 Auditing", "05/06 Verified", "06/06 Next Step"];

    var hasTex = ex.hasTex !== undefined ? ex.hasTex : p >= 5;
    var hasTable = ex.hasTable !== undefined ? ex.hasTable : p >= 6;
    var writerFixed = ex.writerFixed !== undefined ? ex.writerFixed : p >= 10;

    var tasks = [];
    var files = [];
    var roleTasks = {
      main: zh ? "初始化三窗格团队并读取课题上下文" : "Initialize 3-pane team & load project context",
      engineer: zh ? "就绪：等待基准与消融实验派工" : "Ready for baseline & ablation benchmark assignment",
      writer: zh ? "就绪：准备参与路由形式化与论文立意" : "Ready for routing formulation & narrative co-design"
    };
    var tabBadge = { text: zh ? "就绪" : "ready", attention: false };
    var mcpStrip = null;

    if (p === 0) {
      files = [
        { path: "IDEA_REPORT.md", stat: "init", tone: "neutral" },
        { path: "results/table1.json", stat: "--", tone: "neutral" },
        { path: "paper/method.tex", stat: "--", tone: "neutral" },
        { path: "CLAIM_AUDIT.md", stat: "--", tone: "neutral" }
      ];
      tasks.push({
        id: "team-init",
        owner: "main",
        worker: "writer",
        active: true,
        tone: "wait",
        statusText: zh ? "准备讨论" : "Ready to frame",
        goal: zh ? "围绕 32k 长上下文稀疏路由确立研究假设" : "Frame sub-quadratic KV routing hypothesis for 32k context",
        report: zh ? "三窗格已连接 ~/research/sparse-attn-paper，等待主控发起 /research-refine。" : "3 panes bound to ~/research/sparse-attn-paper; awaiting /research-refine.",
        reportTone: "neutral",
        time: "09:10:02",
        files: ["IDEA_REPORT.md"],
        next: zh ? "主控与研究成员共同讨论分块 Sinkhorn 路由立意" : "Co-design block-wise Sinkhorn routing formulation with Gemini",
        record: "IDEA_REPORT.md",
        acceptance: zh ? "待立意定稿" : "Pending formulation",
        reports: []
      });
    } else if (p === 1 || p === 2) {
      var locked = p === 2;
      roleTasks = {
        main: zh ? "调用 /research-refine 收敛文献缺口与方法假设" : "Run /research-refine to synthesize gap & method hypothesis",
        engineer: zh ? "核验本地 NVMe 上 LongBench-32k 与 RULER 数据集切分" : "Verify LongBench-32k & RULER splits on local NVMe",
        writer: zh ? "提炼静态窗口 vs 查询感知分块路由的核心对比" : "Contrast static local windows vs. query-aware block routing"
      };
      files = [
        { path: "notes/formulation.md", stat: zh ? "已同步" : "synced", tone: "ok" },
        { path: "IDEA_REPORT.md", stat: locked ? (zh ? "v2 已定稿" : "v2 locked") : (zh ? "共创中" : "drafting"), tone: locked ? "ok" : "wait", fresh: locked },
        { path: "results/table1.json", stat: "--", tone: "neutral" },
        { path: "paper/method.tex", stat: "--", tone: "neutral" }
      ];
      tabBadge = { text: locked ? (zh ? "方案定稿" : "v2 plan") : (zh ? "讨论中" : "framing"), attention: false };
      tasks.push({
        id: "idea-formulation",
        owner: "main",
        worker: "writer",
        active: !locked,
        tone: locked ? "ok" : "wait",
        statusText: locked ? (zh ? "方案已归档" : "Plan recorded") : (zh ? "共同推演" : "Co-designing"),
        goal: zh ? "形式化查询感知分块路由与有界路由遗憾界（Theorem 1）" : "Formalize query-aware block routing & Theorem 1 regret bound",
        report: locked
          ? (zh ? "已写入 IDEA_REPORT.md (v2)：目标 4.2x 预填充加速下保持 99.1% 召回；LongBench-32k 数据集已就绪。" : "Recorded in IDEA_REPORT.md (v2): target 99.1% recall at 4.2x prefill speedup; LongBench-32k verified.")
          : (zh ? "Gemini 正整理 notes/formulation.md 动机对比，Codex 同步检查本地评测缓存。" : "Gemini drafting motivation in notes/formulation.md while Codex checks dataset splits."),
        reportTone: locked ? "reply" : "wait",
        time: locked ? "09:12:18" : "09:11:30",
        files: locked ? ["IDEA_REPORT.md", "notes/formulation.md"] : ["notes/formulation.md"],
        next: zh ? "主控并行派发：Codex 跑 8k/16k/32k 三种子实验 + Gemini 写第 3 章方法正文" : "Main dispatches parallel 8k/16k/32k 3-seed sweep (Codex) & Section 3 draft (Gemini)",
        record: "IDEA_REPORT.md",
        acceptance: zh ? "验收见 IDEA_REPORT.md" : "Consult IDEA_REPORT.md",
        reports: []
      });
    } else if (p >= 3 && p <= 8) {
      roleTasks = {
        main: zh ? "统筹等待双端产物；收到可见通知后打开核验" : "Coordinate parallel waits; inspect deliverables on visible notice",
        engineer: zh ? "运行 8k/16k/32k 三种子对比 (FA2 vs Ours) 并导出 table1.json" : "Run 8k/16k/32k 3-seed FA2 vs. Ours sweep & export table1.json",
        writer: zh ? "基于 IDEA_REPORT.md 撰写 paper/method.tex 第 3 章方法与定理" : "Draft Section 3 equations & complexity table in paper/method.tex"
      };

      var expStat = hasTable ? (zh ? "已报告·待核" : "reported") : (p === 3 ? (zh ? "已派工" : "queued") : (zh ? "评测中" : "running"));
      var texStat = hasTex ? (zh ? "初稿·待核" : "draft in") : (p === 3 ? (zh ? "已派工" : "queued") : (zh ? "撰写中" : "writing"));

      files = [
        { path: "IDEA_REPORT.md", stat: "v2", tone: "neutral" },
        { path: "results/table1.json", stat: expStat, tone: hasTable ? "check" : "wait", fresh: p === 6 },
        { path: "paper/method.tex", stat: texStat, tone: hasTex ? "check" : "wait", fresh: p === 5 }
      ];
      if (p >= 8) {
        files.push({ path: "notes/UNITS.md", stat: zh ? "已回复" : "replied", tone: "ok", fresh: p === 8 });
      }
      files.push({ path: "CLAIM_AUDIT.md", stat: "--", tone: "neutral" });

      if (p === 3) tabBadge = { text: zh ? "2 等待" : "2 waits", attention: false };
      else if (p === 4) tabBadge = { text: zh ? "执行中" : "running", attention: false };
      else if (p === 5) tabBadge = { text: zh ? "1 已交" : "1 arrived", attention: true };
      else if (p === 6) tabBadge = { text: zh ? "2 待核" : "2 to check", attention: true };
      else if (p === 7) tabBadge = { text: zh ? "1 提问" : "1 blocked", attention: true };
      else tabBadge = { text: zh ? "澄清已回" : "clarified", attention: true };

      /* Handle 1: Benchmark results/table1.json */
      tasks.push({
        id: "ablation-32k",
        owner: "main",
        worker: "engineer",
        active: true,
        tone: hasTable ? "check" : "wait",
        fresh: p === 6,
        statusText: hasTable ? (zh ? "已报告完成 · 待核验" : "Reported · Needs check") : (zh ? "等待中" : "Active wait"),
        goal: zh ? "8k / 16k / 32k 三种子基准对比（FlashAttention-2 vs. 本文方法）" : "8k / 16k / 32k 3-seed benchmark sweep (FlashAttention-2 vs. Ours)",
        report: hasTable
          ? (zh ? "已交回 results/table1.json：32k 下 33.8ms（较 FA2 68.1ms 提速 2.01x），LongBench-32k 准确率 41.7 ± 0.18，待主控核验。" : "Exported results/table1.json: 33.8ms at 32k (2.01x vs FA2 68.1ms), LongBench-32k acc 41.7 ± 0.18; awaiting main check.")
          : (p === 3
              ? (zh ? "已登记等待句柄，Codex 正在准备 32k 算子单测与 3 随机种子评测（交付尚未生成）。" : "Handle registered; Codex preparing 32k kernel unit tests & 3-seed sweep (not delivered yet).")
              : (zh ? "算子单测通过 (12/12)，基准评测运行中，尚未生成 results/table1.json。" : "Kernel unit tests passed (12/12); sweep in progress, results/table1.json not yet written.")),
        reportTone: hasTable ? "check" : "wait",
        time: hasTable ? "09:24:15" : "09:21:04",
        files: hasTable ? ["results/table1.json"] : [],
        next: hasTable
          ? (zh ? "可见通知 → 主控打开 results/table1.json 与方法正文交叉核验" : "Visible notice → Main opens results/table1.json & method draft for cross-check")
          : (zh ? "导出 results/table1.json 后回报主控复核" : "Export results/table1.json and report back to main"),
        record: "IDEA_REPORT.md",
        acceptance: zh ? "验收见原记录（未做科学验收）" : "Consult original record (not evaluated)",
        reports: hasTable ? [
          { outcome: "completed", badge: zh ? "已报告完成 · 待核验" : "Reported · Needs check", tone: "check", time: "09:24:15", path: "reports/ablation-32k/0001.json", msg: zh ? "3 种子评测已写入 results/table1.json，等待主控核验。" : "3-seed metrics written to results/table1.json; awaiting main verification." }
        ] : []
      });

      /* Handle 2: Clarification between Gemini & Codex (only AFTER table1 + method.tex exist!) */
      if (p >= 7) {
        var replied = p >= 8;
        var askRep = {
          outcome: "blocked",
          badge: zh ? "受阻 · 待澄清" : "Blocked · Question",
          tone: "ask",
          time: "09:25:10",
          path: "reports/units-clarify/0001.json",
          msg: zh ? "Gemini 提问：table1.json 中 33.8ms 为单步还是端到端均值？3 个随机种子如何聚合写入正文表？" : "Gemini asks: Is 33.8ms in table1.json per-forward mean, and how are the 3 seeds aggregated for Section 3?"
        };
        var ansRep = {
          outcome: "reply",
          badge: zh ? "已回复澄清" : "Clarification reply",
          tone: "reply",
          time: "09:26:42",
          path: "reports/units-clarify/0002.json",
          msg: zh ? "工程回复：单位为 ms（单次前向均值），按 3 种子原始记录汇总均值±标准差（±0.18）；详见 notes/UNITS.md。" : "Engineer reply: Unit is ms (single forward pass mean), aggregated over raw 3-seed runs (±0.18); see notes/UNITS.md."
        };
        tasks.unshift({
          id: "units-clarify",
          owner: "writer",
          worker: "engineer",
          isClarify: true,
          active: true,
          tone: replied ? "ok" : "ask",
          fresh: true,
          statusText: replied ? (zh ? "已回复澄清" : "Clarified") : (zh ? "等工程澄清" : "Awaiting reply"),
          goal: zh ? "确认延迟单位与 3 随机种子聚合口径后再合入方法说明" : "Confirm latency unit & 3-seed aggregation before locking prose table",
          report: replied ? ansRep.msg : askRep.msg,
          reportTone: replied ? "reply" : "ask",
          time: replied ? ansRep.time : askRep.time,
          files: replied ? ["notes/UNITS.md"] : [],
          next: replied
            ? (zh ? "可见通知 → 研究成员读回复整理方法说明；共享正文由主控收口" : "Visible notice → Writer reads reply to finalize prose note; main integrates shared text")
            : (zh ? "等待工程角色核对原始日志并回复单位说明" : "Engineer checks raw seed logs and replies with unit spec"),
          record: "notes/UNITS.md",
          acceptance: zh ? "澄清记录见 notes/UNITS.md" : "Clarification in notes/UNITS.md",
          reports: replied ? [askRep, ansRep] : [askRep]
        });
      }

      /* Handle 3: Method draft paper/method.tex */
      tasks.push({
        id: "method-sec3",
        owner: "main",
        worker: "writer",
        active: true,
        tone: hasTex ? "check" : "wait",
        fresh: p === 5,
        statusText: hasTex ? (zh ? "已报告完成 · 待核验" : "Reported · Needs check") : (zh ? "撰写中" : "Drafting"),
        goal: zh ? "撰写 paper/method.tex 第 3 章（查询感知分块路由与定理 1）" : "Draft Section 3 (Query-Aware Block Routing & Theorem 1) in paper/method.tex",
        report: hasTex
          ? (p >= 8
              ? (zh ? "已完成 paper/method.tex (+118 行) 并按 notes/UNITS.md 对齐延迟口径，待主控执行数值核查。" : "Drafted paper/method.tex (+118 lines) & aligned latency unit with notes/UNITS.md; awaiting claim audit.")
              : (zh ? "已交回 paper/method.tex 初稿 (+118 行，含复杂度对比表与延迟占位)，待与实验表联核。" : "Submitted paper/method.tex initial draft (+118 lines, complexity table & placeholders); awaiting cross-check."))
          : (zh ? "正在组织分块路由公式推导与复杂度对比表（尚未落盘 paper/method.tex）。" : "Structuring routing equations & complexity comparison (paper/method.tex not yet written)."),
        reportTone: hasTex ? "check" : "wait",
        time: hasTex ? "09:23:40" : "09:21:18",
        files: hasTex ? ["paper/method.tex"] : [],
        next: hasTex
          ? (zh ? "主控运行 /paper-claim-audit 逐项核对正文与 table1.json" : "Main runs /paper-claim-audit against results/table1.json")
          : (zh ? "完成第 3 章初稿后交回主控" : "Complete Section 3 draft and report to main"),
        record: "IDEA_REPORT.md",
        acceptance: zh ? "验收见原记录（未做科学验收）" : "Consult original record (not evaluated)",
        reports: hasTex ? [
          { outcome: "completed", badge: zh ? "已报告完成 · 待核验" : "Reported · Needs check", tone: "check", time: "09:23:40", path: "reports/method-sec3/0001.json", msg: zh ? "paper/method.tex (+118 行) 已交回，请对照实验 JSON 核验主张。" : "paper/method.tex (+118 lines) ready; verify numerical claims against table1.json." }
        ] : []
      });
    } else if (p === 9 || p === 10) {
      var doneAudit = p === 10;
      roleTasks = {
        main: zh ? "运行 /paper-claim-audit 对照实验 JSON 核验第 3 章全部数值" : "Run /paper-claim-audit verifying Section 3 claims against table1.json",
        engineer: zh ? "执行 verify_numbers.py 复核表格与原始种子记录一致性" : "Run verify_numbers.py checking table cells against raw seed JSON",
        writer: writerFixed
          ? (zh ? "已按审阅意见将第 84 行精度收紧为 41.7 ± 0.18" : "Applied Line 84 precision revision: exact 41.7 ± 0.18")
          : (zh ? "等待审阅反馈，准备修订不确定性表述" : "Standing by to tighten uncertainty wording in method.tex")
      };

      files = [
        { path: "IDEA_REPORT.md", stat: "v2", tone: "neutral" },
        { path: "results/table1.json", stat: doneAudit ? (zh ? "已核验" : "verified") : (zh ? "核对中" : "checking"), tone: doneAudit ? "ok" : "check" },
        { path: "notes/UNITS.md", stat: zh ? "已归档" : "logged", tone: "neutral" },
        { path: "paper/method.tex", stat: writerFixed ? (zh ? "已修订" : "revised") : (zh ? "核对中" : "auditing"), tone: writerFixed ? "ok" : "check", fresh: writerFixed && !doneAudit },
        { path: "CLAIM_AUDIT.md", stat: doneAudit ? (zh ? "14/14 对齐" : "14/14 match") : (zh ? "生成中…" : "pending…"), tone: doneAudit ? "ok" : "wait", fresh: doneAudit }
      ];

      tabBadge = doneAudit
        ? { text: zh ? "已核验" : "verified", attention: false }
        : { text: zh ? "核验中" : "auditing", attention: true };

      if (showReview) {
        mcpStrip = {
          heading: UI[lang].mcpHeading,
          body: doneAudit
            ? (zh ? "独立 fresh reviewer 提示 LongBench-32k 标准差应写明 ±0.18（而非 ±0.1）；Gemini 已修订第 84 行，Codex 复核通过。" : "Fresh reviewer flagged LongBench-32k std precision (±0.18 vs ±0.1); Gemini revised Line 84 and Codex verified.")
            : (zh ? "对照读取 paper/method.tex 与 results/table1.json：发现第 84 行标准差精度需由 ±0.1 收紧为 ±0.18。" : "Cross-reading paper/method.tex & results/table1.json: flagged Line 84 std precision (±0.1 → ±0.18).")
        };
      }

      tasks.push({
        id: "claim-audit",
        owner: "main",
        worker: "writer",
        active: !doneAudit,
        tone: doneAudit ? "ok" : "check",
        fresh: true,
        statusText: doneAudit ? (zh ? "主控已读核验" : "Main verified") : (zh ? "已回报 · 主控核验中" : "Reported · Main checking"),
        goal: zh ? "逐项对齐 paper/method.tex 与 results/table1.json 的 14 处实证数值" : "Verify all 14 latency & accuracy claims across method.tex and table1.json",
        report: doneAudit
          ? (zh ? "CLAIM_AUDIT.md 已落盘：第 84 行已修正为 41.7 ± 0.18，全部 14/14 处时延与准确率同原始 JSON 严格一致。" : "CLAIM_AUDIT.md written: Line 84 tightened to 41.7 ± 0.18; all 14/14 claims match results/table1.json.")
          : (writerFixed
              ? (zh ? "Gemini 已修订第 84 行精度 (±0.18)，主控与 Codex 正在完成 CLAIM_AUDIT.md 最终核对（尚未签发核验）。" : "Gemini revised Line 84 (±0.18); main & Codex finalizing CLAIM_AUDIT.md (verification not yet recorded).")
              : (zh ? "主控已打开双端交付启动核查；CLAIM_AUDIT.md 生成前保持“已回报待核”状态。" : "Main opened deliverables to run audit; status stays 'reported awaiting check' until CLAIM_AUDIT.md lands.")),
        reportTone: doneAudit ? "reply" : "check",
        time: doneAudit ? "09:29:50" : "09:28:12",
        files: doneAudit ? ["CLAIM_AUDIT.md", "paper/method.tex", "results/table1.json"] : ["paper/method.tex", "results/table1.json"],
        next: doneAudit
          ? (zh ? "保存核验结论；准备下一已授权动作（64k 外推评测与图 2 图注）" : "Record verified state; ready for next authorized step (64k scaling plot & Figure 2)")
          : (zh ? "完成第 84 行精度修订并写出 CLAIM_AUDIT.md" : "Apply Line 84 precision fix & write CLAIM_AUDIT.md"),
        record: "CLAIM_AUDIT.md",
        acceptance: doneAudit ? (zh ? "主控已核验 · 见 CLAIM_AUDIT.md" : "Verified in CLAIM_AUDIT.md") : (zh ? "待 CLAIM_AUDIT.md 落盘" : "Pending CLAIM_AUDIT.md"),
        reports: []
      });
    } else {
      /* Phase 11: Scene 5 Take Over / Resume */
      roleTasks = {
        main: zh ? "从已保存记录续接原团队；派发 64k 外推图任务" : "Resume from saved records with live team; route 64k plot step",
        engineer: zh ? "待命：可执行 64k 外推脚本或由你直接在终端接手" : "Ready for 64k scaling sweep or direct shell commands",
        writer: zh ? "可见通知：打开下一份工作包，准备更新 Figure 2 图注与摘要" : "Visible notice: open next packet to draft Figure 2 caption & abstract"
      };

      files = [
        { path: "IDEA_REPORT.md", stat: zh ? "已保存" : "saved", tone: "neutral" },
        { path: "results/table1.json", stat: zh ? "已核验" : "verified", tone: "ok" },
        { path: "paper/method.tex", stat: zh ? "已对齐" : "aligned", tone: "ok" },
        { path: "CLAIM_AUDIT.md", stat: "14/14", tone: "ok" }
      ];

      tabBadge = { text: zh ? "下一动作" : "next step", attention: false };

      tasks.push({
        id: "figure2-64k",
        owner: "main",
        worker: "engineer",
        active: true,
        tone: "wait",
        fresh: true,
        statusText: zh ? "下一已授权动作" : "Next authorized",
        goal: zh ? "补跑 64k 外推延迟曲线并同步更新 Figure 2 图注（续接原团队，非自动重建）" : "Add 64k extrapolation curve & Figure 2 caption (continuing bound team, no rebuild)",
        report: zh ? "已从项目恢复入口读回 IDEA_REPORT.md、table1.json 与 CLAIM_AUDIT.md；主控将 64k 扩展评测交 Codex，Gemini 经通知打开下一工作包。" : "Loaded IDEA_REPORT.md, table1.json & CLAIM_AUDIT.md via recovery pointer; routing 64k sweep to Codex & Figure 2 caption packet to Gemini.",
        reportTone: "wait",
        time: "09:32:10",
        files: ["IDEA_REPORT.md", "CLAIM_AUDIT.md"],
        next: zh ? "Codex 导出 64k 曲线数据 → Gemini 更新图 2 分析并编译 paper/main.pdf" : "Codex exports 64k curve → Gemini updates Figure 2 discussion & compiles paper/main.pdf",
        record: "IDEA_REPORT.md",
        acceptance: zh ? "前序 14/14 已核验 · 本步待执行" : "Prior 14/14 verified · New step queued",
        reports: []
      });

      tasks.push({
        id: "stage1-archive",
        owner: "main",
        worker: "writer",
        active: false,
        tone: "ok",
        statusText: zh ? "等待已收口" : "Wait closed",
        goal: zh ? "前序已完成：32k 对比表 + 第 3 章方法正文 + 单位澄清" : "Completed stage: 32k table + Section 3 draft + unit clarification",
        report: zh ? "全部 14 项指标已在 CLAIM_AUDIT.md 核对归档，隔天重开项目可直接沿原记录续接。" : "All 14 claims verified in CLAIM_AUDIT.md; project records persist across days and sessions.",
        reportTone: "reply",
        time: "09:29:50",
        files: ["results/table1.json", "paper/method.tex", "notes/UNITS.md"],
        next: zh ? "无需重复跑批；直接复用已核验产物" : "Reuse verified artifacts without re-running sweeps",
        record: "CLAIM_AUDIT.md",
        acceptance: zh ? "验收见 CLAIM_AUDIT.md" : "Recorded in CLAIM_AUDIT.md",
        reports: []
      });
    }

    var deliveredFiles = files.filter(function (f) {
      return f.stat !== "--" && f.stat !== "init" && f.stat !== "已派工" && f.stat !== "queued" && f.stat !== "评测中" && f.stat !== "running" && f.stat !== "撰写中" && f.stat !== "writing" && f.stat !== "生成中…" && f.stat !== "pending…";
    }).map(function (f) { return f.path; });

    return {
      phaseNum: p,
      phaseId: phaseIds[p],
      stageBadge: stageBadges[p],
      sceneIndex: ex.sceneIndex !== undefined ? ex.sceneIndex : (p === 0 ? 0 : p <= 2 ? 1 : p === 3 ? 2 : p <= 8 ? 3 : p <= 10 ? 4 : 5),
      lang: lang,
      theme: theme,
      showReview: showReview,
      tabBadge: tabBadge,
      mcpStrip: mcpStrip,
      tasks: tasks,
      files: files,
      roleTasks: roleTasks,
      deliveredFiles: deliveredFiles
    };
  }

  function stageSummary(snap) {
    var zh = snap.lang === "zh", p = snap.phaseNum;
    if (p === 11) return zh ? "进度已保存，原团队接着做下一步" : "Progress saved. The original team continues.";
    if (p === 10) return zh ? "主控已核验，准备下一项研究工作" : "Main verified the evidence. Ready for the next step.";
    if (p === 9) return zh ? "主控打开交付，核验后再接续写作" : "Main opens the deliverables before continuing the paper.";
    if (p === 8) return zh ? "结果已交回，主控核验后接续写作" : "Results returned. Main checks the evidence before writing continues.";
    if (p === 7) return zh ? "写作提出疑问，工程澄清指标口径" : "Writing asks a question. Engineering clarifies the measurements.";
    if (p === 6) return zh ? "工程结果已到，等待主控核验" : "Engineering results are in. Waiting for main's check.";
    if (p === 5) return zh ? "方法初稿已到，工程继续跑实验" : "The method draft is in. Engineering is still running.";
    if (p === 4) return zh ? "工程跑实验，Gemini 同步写正文" : "Engineering runs experiments while Gemini writes.";
    if (p === 3) return zh ? "任务已派发，工程与写作并行推进" : "Tasks dispatched. Engineering and writing work in parallel.";
    return zh ? "一起讨论研究方案，再把工作交给团队" : "Discuss the research idea, then hand the work to the team.";
  }

  function actionCopy(tk, snap) {
    var zh = snap.lang === "zh", p = snap.phaseNum;
    var title = tk.goal, report = tk.report, next = tk.next;
    if (tk.id === "units-clarify") {
      title = p >= 8 ? (zh ? "写作读回澄清" : "Writing reads the clarification") : (zh ? "写作需要一次澄清" : "Writing needs a clarification");
      report = p >= 8 ? (zh ? "工程已说明延迟单位与三种子汇总口径。" : "Engineering clarified the latency units and aggregation across three seeds.") : (zh ? "Gemini 想确认延迟单位，以及如何把种子结果写入正文。" : "Gemini asks about latency units and how to report the seed results.");
      next = p >= 8 ? (zh ? "研究成员读回复，补充方法说明" : "Read the reply and update the method note") : (zh ? "工程回复单位与聚合方法" : "Engineering replies with the units and aggregation");
    } else if (tk.id === "ablation-32k") {
      var arrived = snap.deliveredFiles.indexOf("results/table1.json") >= 0;
      title = arrived ? (zh ? "工程结果已到" : "Engineering results are in") : (zh ? "工程正在跑对比实验" : "Engineering runs the benchmark");
      report = arrived ? (zh ? "实验表与原始证据已交回，仍待主控核验。" : "The experiment table and evidence are back, awaiting main's check.") : (zh ? "按已确定的方案，比较 8k、16k、32k 上下文。" : "Compare 8k, 16k and 32k contexts using the agreed plan.");
      next = arrived ? (zh ? "主控打开实验表，对照正文核验" : "Main opens the table and checks the paper") : (zh ? "完成评测，交回结果与日志" : "Return the results and logs after the run");
    } else if (tk.id === "method-sec3") {
      var drafted = snap.deliveredFiles.indexOf("paper/method.tex") >= 0;
      title = drafted ? (zh ? "方法初稿已到" : "The method draft is in") : (zh ? "Gemini 主写方法正文" : "Gemini writes the method");
      report = drafted ? (zh ? "第 3 章初稿已交回，等待与工程证据对照。" : "The Section 3 draft is back, ready to check against the evidence.") : (zh ? "把共同讨论的研究思路组织成公式与论文段落。" : "Turn the shared research idea into equations and paper prose.");
      next = drafted ? (zh ? "主控对照实验结果，逐项核查主张" : "Main checks the claims against the experiment") : (zh ? "完成方法初稿，交回主控" : "Return the completed draft to main");
    } else if (tk.id === "claim-audit") {
      title = p === 10 ? (zh ? "主控已核验" : "Main verified the evidence") : (zh ? "等待主控完成核验" : "Waiting for main's check");
      report = p === 10 ? (zh ? "主控已对齐正文与原始结果；核验结论已记录。" : "Main matched the paper to the original results and recorded the check.") : (zh ? "主控已打开交付，团队按审阅意见核对并修订。" : "Main has opened the deliverables. The team checks and revises them.");
      next = p === 10 ? (zh ? "保存结论，准备 64k 外推图与图注" : "Save the decision and prepare the 64k plot and caption") : (zh ? "完成精度修订，写回核验记录" : "Finish the precision fix and record the check");
    } else if (tk.id === "figure2-64k") {
      title = zh ? "原团队接着做下一步" : "The original team takes the next step";
      report = zh ? "读回已保存的决定与结果，无需重做已核验工作。" : "Read the saved decisions and evidence without repeating verified work.";
      next = zh ? "工程补 64k 曲线，Gemini 更新图注" : "Engineering adds the 64k curve; Gemini updates the caption";
    } else if (tk.id === "stage1-archive") {
      title = zh ? "前一阶段已收口" : "The previous stage is recorded";
      report = zh ? "实验表、方法正文和核验结论均已保存。" : "The experiment, method and verification record are saved.";
      next = zh ? "复用已核验产物" : "Reuse the verified artifacts";
    }
    return {title:title, report:report, next:next};
  }

  function buildBoardHref(snap) {
    var params = new URLSearchParams();
    params.set("phase", String(snap.phaseNum));
    params.set("lang", snap.lang);
    params.set("theme", snap.theme);
    params.set("review", snap.showReview ? "1" : "0");
    return "progress-board.html?" + params.toString();
  }

  /* ========================================================================
     MODE A: HOMEPAGE HERDR TWO-TAB INTEGRATION
     ======================================================================== */
  function initHomepageCase() {
    var workspace = document.querySelector(".herdr-workspace");
    var tabbar = workspace && workspace.querySelector(".herdr-tabbar");
    var tabsLeft = tabbar && tabbar.querySelector(".herdr-tabs-left");
    var panesGrid = workspace && workspace.querySelector(".panes-grid");
    if (!workspace || !tabbar || !tabsLeft || !panesGrid) return;

    panesGrid.id = panesGrid.id || "herdr-panes-view";

    var state = {
      activeTab: "team",
      lastPanelKey: "",
      lastBadgeText: "",
      lastHref: "",
      currentSnap: snapshotFromPhase(0, "en", "warm", true)
    };

    /* Build two real tab buttons inside .herdr-tabs-left */
    tabsLeft.classList.add("pcase-tablist");
    tabsLeft.setAttribute("role", "tablist");
    tabsLeft.setAttribute("aria-label", "SuperARIS workbench views");

    var btnTeamLabel = el("span", null, "Team Workbench");
    var btnTeam = el("button", {
      type: "button",
      id: "herdr-tab-team",
      className: "pcase-tab-btn active",
      role: "tab",
      "aria-selected": "true",
      "aria-controls": panesGrid.id,
      onClick: function () { selectTab("team"); }
    }, btnTeamLabel);

    var btnProgLabel = el("span", null, "Progress");
    var tabBadgeEl = el("span", { className: "pcase-tab-badge" }, "ready");
    var btnProg = el("button", {
      type: "button",
      id: "herdr-tab-progress",
      className: "pcase-tab-btn",
      role: "tab",
      "aria-selected": "false",
      "aria-controls": "herdr-progress-panel",
      onClick: function () { selectTab("progress"); }
    }, btnProgLabel, tabBadgeEl);

    tabsLeft.replaceChildren(btnTeam, btnProg);

    /* Right side of .herdr-tabbar: keep mobile pane switcher + add real browser link */
    var openFullSpan = el("span", { className: "pcase-open-full-text" }, "Open in browser ↗");
    var openShortSpan = el("span", { className: "pcase-open-short-text" }, "Browser ↗");
    var openLink = el("a", {
      id: "pcase-open-board-link",
      className: "pcase-open-link",
      href: "progress-board.html?phase=0&lang=en&theme=warm&review=1",
      target: "_blank",
      rel: "noopener"
    }, openFullSpan, openShortSpan);

    var mobileTabs = document.getElementById("mobile-pane-tabs");
    var rightWrap = el("div", { className: "pcase-tabbar-right" });
    if (mobileTabs) {
      rightWrap.appendChild(mobileTabs);
    }
    rightWrap.appendChild(openLink);
    tabbar.appendChild(rightWrap);

    /* Mount sibling progress panel inside .herdr-workspace without touching .panes-grid */
    var panel = el("section", {
      id: "herdr-progress-panel",
      className: "pcase-herdr-panel",
      role: "tabpanel",
      "aria-labelledby": "herdr-tab-progress",
      hidden: true
    });
    workspace.appendChild(panel);

    function renderHerdrPanel(snap, allowFlash) {
      var dict = UI[snap.lang] || UI.en;
      var activeWaits = snap.tasks.filter(function (t) { return t.active; }).length;

      var topBar = el("div", { className: "pcase-term-bar" },
        el("strong", { className: "pcase-current-action" }, stageSummary(snap)),
        el("div", { className: "pcase-term-pills" },
          el("span", { className: "pcase-tpill" }, snap.stageBadge),
          el("span", { className: "pcase-tpill " + (activeWaits ? "tp-wait" : "tp-ok") },
            snap.lang === "zh" ? ("活跃等待 " + activeWaits) : ("Active " + activeWaits)
          ),
          el("span", { className: "pcase-tpill tp-check" },
            snap.lang === "zh" ? ("已落盘 " + snap.deliveredFiles.length) : ("Files " + snap.deliveredFiles.length)
          )
        )
      );

      var leftItems = [el("div", { className: "pcase-sec-label" }, el("span", null, dict.termFlowTitle))];

      if (snap.mcpStrip) {
        leftItems.push(el("div", { className: "pcase-mcp-strip" },
          el("strong", null, snap.mcpStrip.heading),
          el("span", null, snap.mcpStrip.body)
        ));
      }

      snap.tasks.forEach(function (tk) {
        var copy = actionCopy(tk, snap);
        var oRole = dict.roles[tk.owner] || { name: tk.owner, harness: "" };
        var wRole = dict.roles[tk.worker] || { name: tk.worker, harness: "" };
        var pillCls = tk.tone === "ok" ? "tp-ok" : tk.tone === "check" ? "tp-check" : tk.tone === "ask" ? "tp-ask" : "tp-wait";
        var cardCls = "pcase-tcard tc-" + (tk.tone || "wait") + (allowFlash && tk.fresh ? " is-fresh" : "");
        var verb = !tk.active ? dict.archivedFrom : (tk.isClarify ? dict.clarifyWith : dict.waitsOn);

        leftItems.push(el("article", { className: cardCls },
          el("div", { className: "pcase-tcard-head" },
            el("div", { className: "pcase-rel" },
              el("span", { className: "pcase-actor ac-" + tk.owner }, oRole.name + " · " + oRole.harness),
              el("span", { className: "pcase-rel-arrow" }, "◀ " + verb + " ──"),
              el("span", { className: "pcase-actor ac-" + tk.worker }, wRole.name + " · " + wRole.harness)
            ),
            el("span", { className: "pcase-tpill " + pillCls }, tk.statusText)
          ),
          el("div", { className: "pcase-tcard-goal" }, copy.title),
          el("div", { className: "pcase-tcard-report" }, copy.report),
          el("div", { className: "pcase-tcard-next" },
            el("span", null,
              el("span", { className: "pcase-next-kicker" }, dict.nextAuth + ":"),
              copy.next
            ),
            tk.files.length ? el("span", { style: "display:inline-flex;gap:4px;flex-wrap:wrap;" },
              tk.files.map(function (fp) { return el("span", { className: "pcase-fchip" }, fp); })
            ) : null
          )
        ));
      });

      var roleRows = ["main", "engineer", "writer"].map(function (rid) {
        var r = dict.roles[rid];
        return el("div", { className: "pcase-trole-row" },
          el("div", { className: "pcase-trole-top" },
            el("span", { className: "pcase-trole-name" }, r.name + " · " + r.harness),
            el("span", { className: "pcase-term-dim", style: "font-size:10.5px;" }, r.scope)
          ),
          el("div", { className: "pcase-trole-sub" }, snap.roleTasks[rid])
        );
      });

      var fileRows = snap.files.map(function (f) {
        var pCls = f.tone === "ok" ? "tp-ok" : f.tone === "check" ? "tp-check" : f.tone === "wait" ? "tp-wait" : "";
        return el("div", { className: "pcase-tfile-row" + (allowFlash && f.fresh ? " is-fresh" : "") },
          el("span", { className: "pcase-tfile-name" }, f.path),
          el("span", { className: "pcase-tpill " + pCls }, f.stat)
        );
      });

      var rightItems = [
        el("div", { className: "pcase-sec-label" }, el("span", null, dict.termRolesTitle)),
        el("div", { className: "pcase-tbox" }, roleRows),
        el("div", { className: "pcase-sec-label" }, el("span", null, dict.termFilesTitle)),
        el("div", { className: "pcase-tbox" }, fileRows)
      ];

      var footLink = el("a", {
        href: buildBoardHref(snap),
        target: "_blank",
        rel: "noopener"
      }, dict.openBrowser);

      var foot = el("div", { className: "pcase-term-foot" },
        el("span", null, dict.termFootNote),
        footLink
      );

      panel.replaceChildren(
        topBar,
        el("div", { className: "pcase-term-body" },
          el("div", { className: "pcase-col" }, leftItems),
          el("div", { className: "pcase-col" }, rightItems),
          foot
        )
      );
    }

    function syncFromDemo(allowFlash) {
      if (!window.SuperARISDemo || typeof window.SuperARISDemo.getState !== "function") return;
      var ds = window.SuperARISDemo.getState();
      var derived = deriveFromDemo(ds);
      var snap = snapshotFromPhase(derived.phaseNum, derived.lang, derived.theme, derived.showReview, derived);
      state.currentSnap = snap;

      var dict = UI[snap.lang] || UI.en;
      if (btnTeamLabel.textContent !== dict.tabTeam) btnTeamLabel.textContent = dict.tabTeam;
      if (btnProgLabel.textContent !== dict.tabProgress) btnProgLabel.textContent = dict.tabProgress;
      if (openFullSpan.textContent !== dict.openBrowser) openFullSpan.textContent = dict.openBrowser;
      if (openShortSpan.textContent !== dict.openBrowserShort) openShortSpan.textContent = dict.openBrowserShort;

      var href = buildBoardHref(snap);
      if (href !== state.lastHref) {
        state.lastHref = href;
        openLink.setAttribute("href", href);
      }

      var badgeKey = snap.tabBadge.text + "|" + snap.tabBadge.attention;
      if (badgeKey !== state.lastBadgeText) {
        var hadPrev = state.lastBadgeText !== "";
        state.lastBadgeText = badgeKey;
        tabBadgeEl.textContent = snap.tabBadge.text;
        tabBadgeEl.classList.toggle("is-attention", Boolean(snap.tabBadge.attention));
        if (hadPrev && !ds.reducedMotion) {
          tabBadgeEl.classList.remove("just-bumped");
          void tabBadgeEl.offsetWidth;
          tabBadgeEl.classList.add("just-bumped");
        }
      }

      var panelKey = [snap.phaseNum, snap.lang, snap.showReview ? 1 : 0, derived.writerFixed ? 1 : 0, derived.hasTex ? 1 : 0, derived.hasTable ? 1 : 0].join("|");
      if (panelKey !== state.lastPanelKey) {
        var flash = Boolean(allowFlash && state.lastPanelKey !== "" && !ds.reducedMotion);
        state.lastPanelKey = panelKey;
        renderHerdrPanel(snap, flash);
      }
    }

    function selectTab(tabName) {
      var next = tabName === "progress" ? "progress" : "team";
      state.activeTab = next;
      var isProg = next === "progress";
      workspace.classList.toggle("is-progress-tab", isProg);
      panel.hidden = !isProg;
      btnTeam.classList.toggle("active", !isProg);
      btnTeam.setAttribute("aria-selected", !isProg ? "true" : "false");
      btnProg.classList.toggle("active", isProg);
      btnProg.setAttribute("aria-selected", isProg ? "true" : "false");
      syncFromDemo(false);
      return getPublicState();
    }

    function getPublicState() {
      var snap = state.currentSnap;
      return {
        mode: "homepage",
        activeTab: state.activeTab,
        phase: snap.phaseNum,
        phaseId: snap.phaseId,
        sceneIndex: snap.sceneIndex,
        lang: snap.lang,
        theme: snap.theme,
        showReview: snap.showReview,
        boardUrl: buildBoardHref(snap),
        panesGridVisible: window.getComputedStyle(panesGrid).display !== "none",
        deliverables: snap.deliveredFiles.slice()
      };
    }

    window.addEventListener("superaris:demo-update", function () {
      syncFromDemo(true);
    });

    ["lang-en", "lang-zh", "includeReview", "replay-btn"].forEach(function (id) {
      var ctl = document.getElementById(id);
      if (ctl) {
        ctl.addEventListener("click", function () { setTimeout(function () { syncFromDemo(false); }, 0); });
        ctl.addEventListener("change", function () { setTimeout(function () { syncFromDemo(false); }, 0); });
      }
    });

    var stageSteps = document.getElementById("stage-steps");
    if (stageSteps) {
      stageSteps.addEventListener("click", function () {
        setTimeout(function () { syncFromDemo(false); }, 0);
      });
    }

    if (typeof MutationObserver !== "undefined") {
      var mo = new MutationObserver(function () { syncFromDemo(false); });
      mo.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }

    window.SuperARISProgress = {
      getState: getPublicState,
      selectTab: selectTab
    };

    syncFromDemo(false);

    /* Direct entry handling for ?case=progress */
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("case") === "progress") {
        selectTab("progress");
        var anchor = document.getElementById("workbench") || document.getElementById("herdr-workflow") || workspace;
        if (anchor && typeof anchor.scrollIntoView === "function") {
          requestAnimationFrame(function () {
            anchor.scrollIntoView({ behavior: "auto", block: "start" });
          });
        }
      }
    } catch (_) {}
  }

  /* ========================================================================
     MODE B: STANDALONE WARM CARD SNAPSHOT PAGE (progress-board.html)
     ======================================================================== */
  function initStandaloneBoard() {
    var root = document.getElementById("standalone-board-root");
    var q = new URLSearchParams(window.location.search);
    var initPhase = q.has("phase") ? Number(q.get("phase")) : 8;
    if (isNaN(initPhase)) initPhase = 8;

    var state = {
      phase: Math.max(0, Math.min(11, initPhase)),
      lang: q.get("lang") === "en" ? "en" : "zh",
      theme: q.get("theme") === "dark" ? "dark" : "warm",
      showReview: q.get("review") !== "0",
      expandedHistory: new Set(),
      expandedMeta: new Set(),
      expandedRoles: new Set()
    };

    function syncUrl() {
      try {
        var u = new URL(window.location.href);
        u.searchParams.set("phase", String(state.phase));
        u.searchParams.set("lang", state.lang);
        u.searchParams.set("theme", state.theme);
        u.searchParams.set("review", state.showReview ? "1" : "0");
        window.history.replaceState(null, "", u.toString());
      } catch (_) {}
    }

    function pillClass(tone) {
      if (tone === "check") return "p-check";
      if (tone === "reply" || tone === "ok") return "p-reply";
      if (tone === "ask") return "p-ask";
      if (tone === "wait") return "p-wait";
      return "p-neutral";
    }

    function render() {
      document.body.classList.add("pcase-standalone");
      document.body.dataset.theme = state.theme;
      document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";

      var dict = UI[state.lang] || UI.zh;
      document.title = "SuperARIS · " + dict.boardBadge;
      var snap = snapshotFromPhase(state.phase, state.lang, state.theme, state.showReview);

      var phaseButtons = dict.phaseTabs.map(function (item) {
        var isAct = snap.phaseNum === item.p || (item.p === 2 && snap.phaseNum === 1) || (item.p === 6 && (snap.phaseNum === 4 || snap.phaseNum === 5));
        return el("button", {
          type: "button",
          className: "sb-phase-btn" + (isAct ? " active" : ""),
          onClick: function () {
            state.phase = item.p;
            syncUrl();
            render();
          }
        }, item.label);
      });

      var topbar = el("header", { className: "sb-topbar" },
        el("div", { className: "sb-top-row" },
          el("div", { className: "sb-brand" },
            el("span", { className: "sb-sa" }, "SA"),
            el("span", { className: "sb-pill p-neutral" }, dict.boardBadge),
            el("h1", { className: "sb-title" }, dict.projectTitle),
            el("span", { className: "sb-pill p-brand" }, dict.demoSnapBadge)
          ),
          el("div", { className: "sb-controls" },
            el("a", {
              className: "sb-back-link",
              href: "./?case=progress&lang=" + state.lang
            }, dict.backToDemo),
            el("div", { className: "sb-seg", role: "group", "aria-label": "Theme" },
              el("button", {
                type: "button",
                className: state.theme === "warm" ? "active" : "",
                onClick: function () { state.theme = "warm"; syncUrl(); render(); }
              }, dict.themeWarm),
              el("button", {
                type: "button",
                className: state.theme === "dark" ? "active" : "",
                onClick: function () { state.theme = "dark"; syncUrl(); render(); }
              }, dict.themeDark)
            ),
            el("div", { className: "sb-seg", role: "group", "aria-label": "Language" },
              el("button", {
                type: "button",
                className: state.lang === "zh" ? "active" : "",
                onClick: function () { state.lang = "zh"; syncUrl(); render(); }
              }, "中文"),
              el("button", {
                type: "button",
                className: state.lang === "en" ? "active" : "",
                onClick: function () { state.lang = "en"; syncUrl(); render(); }
              }, "EN")
            )
          )
        ),
        el("div", { className: "sb-phase-bar" },
          el("div", { className: "sb-phase-steps", role: "tablist" }, phaseButtons),
          el("div", { className: "sb-meta-right" },
            el("span", { className: "sb-path" }, dict.projectRoot),
            el("label", { style: "display:inline-flex;align-items:center;gap:4px;cursor:pointer;" },
              el("input", {
                type: "checkbox",
                checked: state.showReview ? "checked" : null,
                onChange: function (e) { state.showReview = Boolean(e.target.checked); syncUrl(); render(); }
              }),
              dict.reviewToggle
            )
          )
        )
      );

      /* Left Column: Task Cards + Optional Fresh MCP Strip */
      var leftCards = [];
      if (snap.mcpStrip) {
        leftCards.push(el("div", { className: "sb-card", style: "border-color: var(--sb-wait-border); background: var(--sb-wait-bg);" },
          el("div", { style: "font-weight:700;font-size:12.5px;color:var(--sb-wait-ink);margin-bottom:3px;" }, snap.mcpStrip.heading),
          el("div", { style: "font-size:12.5px;color:var(--sb-ink);" }, snap.mcpStrip.body)
        ));
      }

      snap.tasks.forEach(function (tk) {
        var copy = actionCopy(tk, snap);
        var oRole = dict.roles[tk.owner] || { name: tk.owner, harness: "" };
        var wRole = dict.roles[tk.worker] || { name: tk.worker, harness: "" };
        var verb = !tk.active ? dict.archivedFrom : (tk.isClarify ? dict.clarifyWith : dict.waitsOn);
        var histOpen = state.expandedHistory.has(tk.id);
        var metaOpen = state.expandedMeta.has(tk.id);

        var historyNode = null;
        if (tk.reports && tk.reports.length > 1) {
          var earlyText = tk.reports[0].badge;
          var btnText = histOpen
            ? dict.collapseHistory.replace("{n}", String(tk.reports.length))
            : dict.expandHistory.replace("{n}", String(tk.reports.length)).replace("{early}", earlyText);
          historyNode = el("div", { className: "sb-history-bar" },
            el("button", {
              type: "button",
              className: "sb-link-btn",
              onClick: function () {
                if (state.expandedHistory.has(tk.id)) state.expandedHistory.delete(tk.id);
                else state.expandedHistory.add(tk.id);
                render();
              }
            }, (histOpen ? "▾ " : "▸ ") + btnText),
            histOpen ? el("div", { className: "sb-history-list" },
              tk.reports.map(function (rep, idx) {
                return el("div", { className: "sb-history-item" },
                  el("div", { className: "sb-report-head" },
                    el("span", { style: "display:inline-flex;align-items:center;gap:6px;" },
                      el("span", { className: "sb-handle" }, "#" + (idx + 1)),
                      el("span", { className: "sb-pill " + pillClass(rep.tone) }, rep.badge),
                      el("span", null, rep.time)
                    ),
                    el("span", { className: "sb-path" }, rep.path)
                  ),
                  el("p", { className: "sb-report-msg" }, rep.msg)
                );
              })
            ) : null
          );
        }

        leftCards.push(el("article", { className: "sb-card by-" + tk.worker + (tk.tone === "ask" ? " is-ask" : "") },
          el("div", { className: "sb-card-top" },
            el("div", { className: "sb-relation" },
              el("span", { className: "sb-actor" }, oRole.name, el("small", null, oRole.harness)),
              el("span", { className: "sb-verb" }, "← " + verb + " ←"),
              el("span", { className: "sb-actor" }, wRole.name, el("small", null, wRole.harness)),
              el("span", { className: "sb-handle" }, "#" + tk.id)
            ),
            el("span", { className: "sb-pill " + pillClass(tk.tone) }, tk.statusText)
          ),
          el("h3", { className: "sb-action-title" }, copy.title),
          el("div", { className: "sb-report" },
            el("p", { className: "sb-report-msg" }, copy.report),
            historyNode
          ),
          el("div", { className: "sb-foot-row" },
            el("div", { className: "sb-next-line" },
              el("span", { className: "sb-kicker" }, dict.nextAuth + ":"),
              copy.next
            ),
            el("button", {
              type: "button",
              className: "sb-link-btn",
              onClick: function () {
                if (state.expandedMeta.has(tk.id)) state.expandedMeta.delete(tk.id);
                else state.expandedMeta.add(tk.id);
                render();
              }
            }, (metaOpen ? "▾ " : "▸ ") + (metaOpen ? dict.hideDetails : dict.details))
          ),
          metaOpen ? el("div", { className: "sb-drawer" },
            el("strong", null, tk.goal),
            el("p", null, tk.report),
            el("p", null, tk.next),
            el("div", { className: "sb-path" }, tk.time),
            el("div", { className: "sb-path" }, tk.files.join(" · ")),
            el("div", null, el("span", { className: "sb-kicker" }, dict.recordFile + ":"), el("span", { className: "sb-path" }, tk.record)),
            el("div", null, tk.acceptance)
          ) : null
        ));
      });

      /* Right Column: Compact Roles + Artifacts + Unified Note */
      var roleCards = ["main", "engineer", "writer"].map(function (rid) {
        var r = dict.roles[rid];
        var open = state.expandedRoles.has(rid);
        return el("article", { className: "sb-card sb-role-card" },
          el("div", { className: "sb-role-top" },
            el("div", { className: "sb-role-left" },
              el("span", { className: "sb-role-name" }, r.name),
              el("span", { className: "sb-model-chip" }, r.model)
            ),
            el("div", { className: "sb-role-left" },
              el("span", { className: "sb-harness" }, r.harness),
              el("button", {
                type: "button",
                className: "sb-link-btn",
                onClick: function () {
                  if (state.expandedRoles.has(rid)) state.expandedRoles.delete(rid);
                  else state.expandedRoles.add(rid);
                  render();
                }
              }, (open ? "▾ " : "▸ ") + dict.details)
            )
          ),
          el("p", { className: "sb-role-task" }, snap.roleTasks[rid]),
          open ? el("div", { className: "sb-drawer" },
            el("div", null, el("span", { className: "sb-kicker" }, dict.writeScope + ":"), el("span", { className: "sb-path" }, r.scope)),
            el("div", null, el("span", { className: "sb-kicker" }, dict.inputMode + ":"), r.mode)
          ) : null
        );
      });

      var filesCard = el("div", { className: "sb-card sb-role-card" },
        el("div", { className: "sb-sec-title", style: "font-size:12.5px;" }, dict.termFilesTitle),
        el("div", { className: "sb-file-list" },
          snap.files.map(function (f) {
            return el("div", { className: "sb-file-row" },
              el("span", { className: "sb-path" }, f.path),
              el("span", { className: "sb-pill " + pillClass(f.tone) }, f.stat)
            );
          })
        )
      );

      topbar.appendChild(el("p", { className: "sb-current-action" }, stageSummary(snap)));
      var grid = el("main", { className: "sb-grid" },
        el("section", null,
          el("div", { className: "sb-sec-head" },
            el("h2", { className: "sb-sec-title" }, dict.termFlowTitle, el("span", { className: "sb-count" }, snap.tasks.length)),
            el("span", { className: "sb-pill p-neutral" }, snap.stageBadge)
          ),
          el("div", { className: "sb-stack" }, leftCards)
        ),
        el("section", null,
          el("div", { className: "sb-sec-head" },
            el("h2", { className: "sb-sec-title" }, dict.termRolesTitle)
          ),
          el("div", { className: "sb-stack" }, roleCards, filesCard),
          el("p", { className: "sb-note" }, dict.standaloneNote)
        )
      );

      root.replaceChildren(el("div", { className: "sb-shell" }, topbar, grid));

      window.SuperARISProgress = {
        getState: function () {
          return {
            mode: "standalone",
            activeTab: "progress",
            phase: snap.phaseNum,
            phaseId: snap.phaseId,
            sceneIndex: snap.sceneIndex,
            lang: snap.lang,
            theme: snap.theme,
            showReview: snap.showReview,
            deliverables: snap.deliveredFiles.slice()
          };
        },
        selectTab: function () { return this.getState(); },
        setPhase: function (nextPhase) {
          state.phase = Math.max(0, Math.min(11, Number(nextPhase) || 0));
          syncUrl();
          render();
          return this.getState();
        }
      };
    }

    render();
  }

  if (isStandalone) {
    initStandaloneBoard();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomepageCase);
  } else {
    initHomepageCase();
  }
})();
