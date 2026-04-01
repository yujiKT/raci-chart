import React, { useState, useMemo, MouseEvent, useEffect } from "react";
import { RACIValue, Role, Phase, INITIAL_ROLES, INITIAL_PHASES } from "./constants";
import { Language, t } from "./i18n";

const RACI_VALUES: RACIValue[] = ["", "R", "A", "C", "I"];
const RACI_COLORS: Record<Exclude<RACIValue, "">, { color: string; bg: string }> = {
  R: { color: "#2563eb", bg: "#dbeafe" },
  A: { color: "#7c3aed", bg: "#ede9fe" },
  C: { color: "#0891b2", bg: "#cffafe" },
  I: { color: "#64748b", bg: "#f1f5f9" },
};
const PHASE_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

const deepClone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

interface BadgeProps {
  value?: RACIValue;
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void;
  lang?: Language;
}

function Badge({ value, onClick, lang = "ja" }: BadgeProps) {
  if (!value) return (
    <span onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, color: "#cbd5e1", fontSize: 14, cursor: onClick ? "pointer" : "default", border: "1.5px dashed #e2e8f0", transition: "all 0.12s", userSelect: "none" }}>+</span>
  );
  const m = RACI_COLORS[value as Exclude<RACIValue, "">];
  const label = t(lang, `raciLabel${value}` as any);
  const desc = t(lang, `raciDesc${value}` as any);
  const titleAttr = t(lang, "badgeTitle", { label, desc });
  return (
    <span onClick={onClick} title={titleAttr}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, fontSize: 13, fontWeight: 700, color: m.color, background: m.bg, border: `1.5px solid ${m.color}30`, cursor: onClick ? "pointer" : "default", transition: "all 0.12s", userSelect: "none" }}
    >{value}</span>
  );
}

interface SmallBadgeProps {
  value?: RACIValue;
}

function SmallBadge({ value }: SmallBadgeProps) {
  if (!value) return null;
  const m = RACI_COLORS[value as Exclude<RACIValue, "">];
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 5, fontSize: 10, fontWeight: 700, color: m.color, background: m.bg }}>{value}</span>;
}

export default function RACIChart() {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem("raci_lang") as Language) || "ja");
  useEffect(() => { localStorage.setItem("raci_lang", lang); document.title = t(lang, "appTitle"); }, [lang]);

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem("raci_roles");
    try { return saved ? JSON.parse(saved) : deepClone(INITIAL_ROLES); } catch { return deepClone(INITIAL_ROLES); }
  });
  useEffect(() => { localStorage.setItem("raci_roles", JSON.stringify(roles)); }, [roles]);

  const [phases, setPhases] = useState<Phase[]>(() => {
    const saved = localStorage.getItem("raci_phases");
    try { return saved ? JSON.parse(saved) : deepClone(INITIAL_PHASES); } catch { return deepClone(INITIAL_PHASES); }
  });
  useEffect(() => { localStorage.setItem("raci_phases", JSON.stringify(phases)); }, [phases]);
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [highlightRole, setHighlightRole] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingPhase, setEditingPhase] = useState<number | null>(null);
  const [showAddTask, setShowAddTask] = useState<number | null>(null);
  const [newTaskName, setNewTaskName] = useState<string>("");
  const [showAddPhase, setShowAddPhase] = useState<boolean>(false);
  const [newPhaseName, setNewPhaseName] = useState<string>("");
  type Toast = { message: string; type: "success" | "error"; persistent: boolean };
  const [newRoleLabel, setNewRoleLabel] = useState<string>("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [editingRoleIdx, setEditingRoleIdx] = useState<number | null>(null);
  const [editRoleLabel, setEditRoleLabel] = useState<string>("");
  const [showAddRole, setShowAddRole] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success", persistent: boolean = false) => {
    setToast({ message: msg, type, persistent });
    if (!persistent) {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const cycleRaci = (pi: number, ti: number, roleId: string) => {
    setPhases(prev => { const n = deepClone(prev); const cur = n[pi].tasks[ti].raci[roleId] || ""; n[pi].tasks[ti].raci[roleId] = RACI_VALUES[(RACI_VALUES.indexOf(cur) + 1) % 5]; return n; });
  };
  const updateTaskName = (pi: number, ti: number, name: string) => { setPhases(prev => { const n = deepClone(prev); n[pi].tasks[ti].name = name; return n; }); };
  const updatePhaseName = (pi: number, name: string) => { setPhases(prev => { const n = deepClone(prev); n[pi].name = name; return n; }); };
  const deleteTask = (pi: number, ti: number) => {
    setConfirmModal({
      title: t(lang, "confirmDeleteTitle"),
      message: t(lang, "confirmDeleteTask"),
      onConfirm: () => {
        setPhases(prev => { const n = deepClone(prev); n[pi].tasks.splice(ti, 1); if (!n[pi].tasks.length) n.splice(pi, 1); return n; });
        setConfirmModal(null);
      }
    });
  };
  const deletePhase = (pi: number) => { setPhases(prev => { const n = deepClone(prev); n.splice(pi, 1); return n; }); setActivePhase(null); };

  const addTask = (pi: number) => {
    if (!newTaskName.trim()) return;
    setPhases(prev => { const n = deepClone(prev); const raci: Record<string, RACIValue> = {}; roles.forEach(r => raci[r.id] = ""); n[pi].tasks.push({ name: newTaskName.trim(), raci }); return n; });
    setNewTaskName(""); setShowAddTask(null);
  };
  const addPhase = () => {
    if (!newPhaseName.trim()) return;
    setPhases(prev => { const n = deepClone(prev); n.push({ name: newPhaseName.trim(), color: PHASE_COLORS[n.length % PHASE_COLORS.length], tasks: [] }); return n; });
    setNewPhaseName(""); setShowAddPhase(false);
  };
  const addRole = () => {
    if (!newRoleLabel.trim()) return;
    const id = "role_" + Date.now();
    setRoles(prev => [...prev, { id, label: newRoleLabel.trim() }]);
    setPhases(prev => { const n = deepClone(prev); n.forEach(ph => ph.tasks.forEach(t => t.raci[id] = "")); return n; });
    setNewRoleLabel(""); setShowAddRole(false);
  };
  const deleteRole = (idx: number) => {
    setConfirmModal({
      title: t(lang, "confirmDeleteTitle"),
      message: t(lang, "confirmDeleteRole"),
      onConfirm: () => {
        const rid = roles[idx].id;
        setRoles(prev => prev.filter((_, i) => i !== idx));
        setPhases(prev => { const n = deepClone(prev); n.forEach(ph => ph.tasks.forEach(t => delete t.raci[rid])); return n; });
        setHighlightRole(null); setEditingRoleIdx(null);
        setConfirmModal(null);
      }
    });
  };
  const updateRoleLabel = (idx: number, label: string) => { setRoles(prev => prev.map((r, i) => i === idx ? { ...r, label } : r)); };

  const [csvModal, setCsvModal] = useState<string | null>(null);
  const [importModal, setImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [importError, setImportError] = useState<string>("");

  const copyCSV = () => {
    const header = [t(lang, "thPhase"), t(lang, "thTask"), ...roles.map(r => r.label)];
    const rows = [header.join(",")];
    phases.forEach(ph => ph.tasks.forEach(t => {
      rows.push([`"${ph.name.replace(/"/g, '""')}"`, `"${t.name.replace(/"/g, '""')}"`, ...roles.map(r => t.raci[r.id] || "")].join(","));
    }));
    const text = rows.join("\n");
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { }
    document.body.removeChild(ta);
    if (ok) {
      showToast(t(lang, "toastCsvCopied"));
    } else {
      setCsvModal(text);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current); current = ""; }
        else { current += ch; }
      }
    }
    result.push(current);
    return result;
  };

  const importCSV = () => {
    setImportError("");
    const lines = importText.trim().replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      const msg = t(lang, "importErrorNoRows");
      setImportError(msg);
      showToast(msg, "error", true);
      return;
    }

    const headerCells = parseCSVLine(lines[0]);
    if (headerCells.length < 3) {
      const msg = t(lang, "importErrorInvalidHeader");
      setImportError(msg);
      showToast(msg, "error", true);
      return;
    }

    const roleLabels = headerCells.slice(2);
    const newRoles = roleLabels.map((label, i) => ({ id: "imp_" + i, label: label.trim() }));

    const phaseMap = new Map();
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      const phaseName = (cells[0] || "").trim();
      const taskName = (cells[1] || "").trim();
      if (!phaseName && !taskName) continue;
      const raci: Record<string, RACIValue> = {};
      newRoles.forEach((r, ri) => {
        const val = (cells[ri + 2] || "").trim().toUpperCase() as RACIValue;
        raci[r.id] = ["R", "A", "C", "I"].includes(val) ? val : "";
      });
      if (!phaseMap.has(phaseName)) {
        phaseMap.set(phaseName, { name: phaseName, color: PHASE_COLORS[[...phaseMap.keys()].length % PHASE_COLORS.length], tasks: [] });
      }
      phaseMap.get(phaseName).tasks.push({ name: taskName, raci });
    }

    if (phaseMap.size === 0) {
      const msg = t(lang, "importErrorNoData");
      setImportError(msg);
      showToast(msg, "error", true);
      return;
    }

    setRoles(newRoles);
    setPhases([...phaseMap.values()]);
    setActivePhase(null);
    setHighlightRole(null);
    setImportModal(false);
    setImportText("");
    showToast(t(lang, "toastImportSuccess", { p: phaseMap.size, t: lines.length - 1 }));
  };

  const visiblePhases = activePhase !== null ? [phases[activePhase]] : phases;
  const visibleIndices = activePhase !== null ? [activePhase] : phases.map((_, i) => i);

  const stats = useMemo(() => {
    const s: Record<string, Record<string, number>> = {}; roles.forEach(r => s[r.id] = { R: 0, A: 0, C: 0, I: 0 });
    phases.forEach(ph => ph.tasks.forEach(t => Object.entries(t.raci).forEach(([rid, val]) => { if (val && s[rid]) s[rid][val]++; })));
    return s;
  }, [phases, roles]);

  const totalTasks = phases.reduce((a, p) => a + p.tasks.length, 0);

  const inp = { padding: "6px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ fontFamily: "'Helvetica Neue','Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic UI','Meiryo',sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "24px 16px", position: "relative" }}>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        .raci-cell:hover{transform:scale(1.18)}
        .task-row:hover td{background:#f8fafc!important}
        input:focus{border-color:#6366f1!important;box-shadow:0 0 0 2px #6366f120}
        button:active{transform:scale(0.97)}
        .toast-container{position:fixed;bottom:24px;left:24px;z-index:1100;display:flex;flex-direction:column;gap:10px}
        .toast-item{background:#0f172a;color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 12px 32px rgba(0,0,0,0.25);animation:fadeIn 0.25s ease;display:flex;align-items:center;gap:12px;max-width:380px;line-height:1.5}
        .toast-error{background:#ef4444;border-left:4px solid #b91c1c}
      `}</style>

      <div className="toast-container">
        {toast && (
          <div className={`toast-item ${toast.type === "error" ? "toast-error" : ""}`}>
            <span>{toast.message}</span>
            {(toast.persistent || toast.type === "error") && (
              <button onClick={() => setToast(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, padding: 0, flexShrink: 0, transition: "background 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.3)"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)"}>✕</button>
            )}
          </div>
        )}
      </div>

      {csvModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setCsvModal(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 700, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t(lang, "csvModalTitle")}</span>
              <button onClick={() => setCsvModal(null)} style={{ border: "none", background: "transparent", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>✕</button>
            </div>
            <textarea
              readOnly
              value={csvModal}
              onFocus={e => e.target.select()}
              style={{ width: "100%", height: 320, fontFamily: "monospace", fontSize: 11.5, padding: 12, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#1e293b", resize: "vertical", outline: "none", lineHeight: 1.5 }}
            />
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{t(lang, "csvModalDesc")}</p>
          </div>
        </div>
      )}

      {importModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setImportModal(false)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 720, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{t(lang, "importModalTitle")}</span>
              <button onClick={() => setImportModal(false)} style={{ border: "none", background: "transparent", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>✕</button>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 14, border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 12, color: "#475569", margin: "0 0 8px", lineHeight: 1.6 }}>
                {t(lang, "importModalDesc1")}
              </p>
              <pre style={{ fontSize: 11, color: "#64748b", margin: 0, fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{t(lang, "importModalFormat").replace(/\\n/g, "\n")}</pre>
            </div>
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(""); }}
              placeholder={t(lang, "importModalPlaceholder")}
              style={{ width: "100%", height: 220, fontFamily: "monospace", fontSize: 11.5, padding: 12, borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", color: "#1e293b", resize: "vertical", outline: "none", lineHeight: 1.5 }}
            />
            {importError && <p style={{ fontSize: 12, color: "#dc2626", margin: 0, fontWeight: 500 }}>{importError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setImportModal(false)} style={{ padding: "8px 18px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{t(lang, "btnCancel")}</button>
              <button onClick={importCSV} disabled={!importText.trim()} style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: importText.trim() ? "#0f172a" : "#cbd5e1", color: "#fff", fontSize: 12, fontWeight: 600, cursor: importText.trim() ? "pointer" : "default" }}>{t(lang, "btnExecuteImport")}</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setConfirmModal(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{confirmModal.title}</span>
              <button onClick={() => setConfirmModal(null)} style={{ border: "none", background: "transparent", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}>✕</button>
            </div>
            <p style={{ fontSize: 13.5, color: "#475569", margin: 0, lineHeight: 1.6 }}>{confirmModal.message}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setConfirmModal(null)} style={{ padding: "8px 18px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>{t(lang, "btnCancel")}</button>
              <button onClick={confirmModal.onConfirm} style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#ef4444", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t(lang, "btnConfirmDelete")}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>{t(lang, "appTitle")}</h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", lineHeight: 1.6 }}>
              {t(lang, "appDesc1")}<br />
              {t(lang, "appDesc2")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{t(lang, "statsSummary", { phases: phases.length, tasks: totalTasks, roles: roles.length })}</span>
            <button onClick={() => { setImportModal(true); setImportText(""); setImportError(""); }} style={{ padding: "7px 16px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><polyline points="8 11 12 15 16 11" /><path d="M20 21H4" /></svg>
              {t(lang, "btnImport")}
            </button>
            <button onClick={copyCSV} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              {t(lang, "btnCsvCopy")}
            </button>
            <select
              value={lang}
              onChange={e => setLang(e.target.value as Language)}
              style={{
                padding: "6.5px 32px 6.5px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                fontSize: 12.5, fontFamily: "inherit", outline: "none", color: "#334155",
                backgroundColor: "#fff", cursor: "pointer", marginRight: 4, fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "13px"
              }}
            >
              <option value="ja">🇯🇵 日本語</option>
              <option value="en">🇺🇸 English</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {["R", "A", "C", "I"].map(k => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "#fff", border: "1px solid #e2e8f0", fontSize: 11.5, color: "#475569" }}>
              <SmallBadge value={k as Exclude<RACIValue, "">} /> {t(lang, `raciLabel${k}` as any)}（{t(lang, `raciDesc${k}` as any)}）
            </span>
          ))}
        </div>

        {/* Phase tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          <button onClick={() => setActivePhase(null)} style={{ padding: "6px 14px", borderRadius: 7, border: activePhase === null ? "2px solid #0f172a" : "1.5px solid #e2e8f0", background: activePhase === null ? "#0f172a" : "#fff", color: activePhase === null ? "#fff" : "#475569", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{t(lang, "allPhases")}</button>
          {phases.map((ph, i) => (
            <button key={i} onClick={() => setActivePhase(activePhase === i ? null : i)} style={{ padding: "6px 14px", borderRadius: 7, border: activePhase === i ? `2px solid ${ph.color}` : "1.5px solid #e2e8f0", background: activePhase === i ? ph.color : "#fff", color: activePhase === i ? "#fff" : "#475569", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              {ph.name}
            </button>
          ))}
          {!showAddPhase
            ? <button onClick={() => setShowAddPhase(true)} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>{t(lang, "btnAddPhase")}</button>
            : <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
              <input style={{ ...inp, width: 140 }} value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addPhase(); if (e.key === "Escape") { setShowAddPhase(false); setNewPhaseName(""); } }} placeholder={t(lang, "placeholderPhaseName")} autoFocus />
              <button onClick={addPhase} style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t(lang, "btnAdd")}</button>
              <button onClick={() => { setShowAddPhase(false); setNewPhaseName(""); }} style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>✕</button>
            </span>
          }
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ position: "sticky", left: 0, background: "#f8fafc", zIndex: 3, textAlign: "left", padding: "11px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", borderBottom: "2px solid #e2e8f0", minWidth: 240 }}>{t(lang, "thTask")}</th>
                {roles.map((r, ri) => (
                  <th key={r.id}
                    style={{ padding: "8px 4px", fontSize: 10.5, fontWeight: highlightRole === r.id ? 700 : 500, color: highlightRole === r.id ? "#0f172a" : "#64748b", textAlign: "center", borderBottom: "2px solid #e2e8f0", background: highlightRole === r.id ? "#e0e7ff" : "#f8fafc", cursor: "pointer", whiteSpace: "nowrap", minWidth: 62, transition: "all 0.12s" }}
                    onClick={() => setHighlightRole(highlightRole === r.id ? null : r.id)}
                    onDoubleClick={() => { setEditingRoleIdx(ri); setEditRoleLabel(r.label); }}
                  >
                    {editingRoleIdx === ri ? (
                      <span style={{ display: "inline-flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                        <input style={{ ...inp, width: 70, fontSize: 10.5, padding: "3px 5px", textAlign: "center" }} value={editRoleLabel}
                          onChange={e => setEditRoleLabel(e.target.value)}
                          onBlur={() => { updateRoleLabel(ri, editRoleLabel); setEditingRoleIdx(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { updateRoleLabel(ri, editRoleLabel); setEditingRoleIdx(null); } if (e.key === "Escape") setEditingRoleIdx(null); }}
                          autoFocus onClick={e => e.stopPropagation()} />
                        <button style={{ padding: "2px 6px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 9, cursor: "pointer" }} onClick={e => { e.stopPropagation(); deleteRole(ri); }}>{t(lang, "btnDelete")}</button>
                      </span>
                    ) : r.label}
                  </th>
                ))}
                <th style={{ padding: "8px 8px", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", minWidth: 36 }}>
                  {!showAddRole
                    ? <button onClick={() => setShowAddRole(true)} title={t(lang, "tooltipAddRole")} style={{ border: "none", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", padding: "2px 6px" }}>＋</button>
                    : <span style={{ display: "inline-flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                      <input style={{ ...inp, width: 64, fontSize: 10, padding: "3px 5px" }} value={newRoleLabel} onChange={e => setNewRoleLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addRole(); if (e.key === "Escape") { setShowAddRole(false); setNewRoleLabel(""); } }}
                        placeholder={t(lang, "placeholderRoleName")} autoFocus />
                      <button onClick={addRole} style={{ padding: "2px 6px", borderRadius: 5, border: "none", background: "#0f172a", color: "#fff", fontSize: 9, cursor: "pointer" }}>{t(lang, "btnAdd")}</button>
                    </span>
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              {visiblePhases.map((phase, vpi) => {
                const pi = visibleIndices[vpi];
                return (
                  <React.Fragment key={pi}>
                    <tr>
                      <td colSpan={roles.length + 2} onDoubleClick={() => setEditingPhase(pi)}
                        style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, color: phase.color, background: `${phase.color}08`, borderBottom: `1px solid ${phase.color}20`, borderLeft: `3px solid ${phase.color}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {editingPhase === pi
                            ? <input style={{ ...inp, fontWeight: 700, color: phase.color, fontSize: 12, width: 200 }} value={phase.name} onChange={e => updatePhaseName(pi, e.target.value)} onBlur={() => setEditingPhase(null)} onKeyDown={e => { if (e.key === "Enter") setEditingPhase(null); }} autoFocus />
                            : <span>{phase.name}</span>
                          }
                          <button onClick={() => { setShowAddTask(pi); setNewTaskName(""); }} style={{ border: "none", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>{t(lang, "btnAddTask")}</button>
                          <button onClick={() => deletePhase(pi)} style={{ border: "none", background: "transparent", color: "#ef4444", fontSize: 10, cursor: "pointer", opacity: 0.5 }}>{t(lang, "btnDeletePhase")}</button>
                        </div>
                      </td>
                    </tr>
                    {showAddTask === pi && (
                      <tr><td colSpan={roles.length + 2} style={{ padding: "6px 14px", background: "#fefce8", borderBottom: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input style={{ ...inp, flex: 1 }} value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTask(pi); if (e.key === "Escape") setShowAddTask(null); }} placeholder={t(lang, "placeholderTaskName")} autoFocus />
                          <button onClick={() => addTask(pi)} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t(lang, "btnAdd")}</button>
                          <button onClick={() => setShowAddTask(null)} style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>✕</button>
                        </div>
                      </td></tr>
                    )}
                    {phase.tasks.map((task, ti) => {
                      const numA = Object.values(task.raci).filter(v => v === 'A').length;
                      const numR = Object.values(task.raci).filter(v => v === 'R').length;
                      const errors = [];
                      if (numA !== 1) errors.push(t(lang, "errorNoA", { n: numA }));
                      if (numR === 0) errors.push(t(lang, "errorNoR"));

                      return (
                        <tr key={ti} className="task-row">
                          <td onDoubleClick={() => setEditingTask(`${pi}-${ti}`)}
                            style={{ position: "sticky", left: 0, background: "#fff", zIndex: 1, padding: "8px 14px", fontSize: 12.5, color: "#1e293b", borderBottom: "1px solid #f1f5f9", lineHeight: 1.4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {editingTask === `${pi}-${ti}`
                                ? <input style={{ ...inp, flex: 1, fontSize: 12.5 }} value={task.name} onChange={e => updateTaskName(pi, ti, e.target.value)} onBlur={() => setEditingTask(null)} onKeyDown={e => { if (e.key === "Enter") setEditingTask(null); }} autoFocus />
                                : <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                                  {task.name}
                                  {errors.length > 0 && (
                                    <span title={errors.join("\n")} style={{ cursor: "help", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: "bold", border: "1px solid #fca5a5", flexShrink: 0 }}>!</span>
                                  )}
                                </span>
                              }
                              <button style={{ border: "none", background: "transparent", color: "#ef4444", opacity: 0.3, fontSize: 10, cursor: "pointer", padding: "2px 4px" }}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.3"}
                                onClick={() => deleteTask(pi, ti)} title={t(lang, "tooltipDeleteTask")}>✕</button>
                            </div>
                          </td>
                          {roles.map(r => (
                            <td key={r.id} style={{ textAlign: "center", padding: "7px 3px", borderBottom: "1px solid #f1f5f9", background: highlightRole === r.id ? "#f0f4ff" : "transparent", transition: "all 0.1s" }}>
                              <span className="raci-cell" style={{ display: "inline-block", transition: "transform 0.1s" }}>
                                <Badge value={task.raci[r.id]} onClick={() => cycleRaci(pi, ti, r.id)} lang={lang} />
                              </span>
                            </td>
                          ))}
                          <td style={{ borderBottom: "1px solid #f1f5f9" }} />
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: "0 0 12px" }}>{t(lang, "roleSummaryTitle")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 8 }}>
            {roles.map((r, ri) => (
              <div key={r.id} onClick={() => setHighlightRole(highlightRole === r.id ? null : r.id)}
                className="role-card"
                style={{ padding: "12px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.12s", border: highlightRole === r.id ? "2px solid #6366f1" : "1px solid #e2e8f0", background: highlightRole === r.id ? "#f0f0ff" : "#fff", position: "relative" }}>
                <style>{`
                  .role-card .delete-btn { opacity: 0; transition: opacity 0.1s; }
                  .role-card:hover .delete-btn { opacity: 1; }
                `}</style>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6, paddingRight: 20 }}>{r.label}</div>
                <button
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteRole(ri); }}
                  title={t(lang, "btnDelete")}
                  style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#fef2f2", color: "#ef4444", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >✕</button>
                <div style={{ display: "flex", gap: 7 }}>
                  {["R", "A", "C", "I"].map(k => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <SmallBadge value={k as RACIValue} />
                      <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{stats[r.id]?.[k] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 10.5, color: "#94a3b8", textAlign: "center", lineHeight: 1.8 }}>
          {t(lang, "footerText")}
        </div>
      </div>
    </div>
  );
}
