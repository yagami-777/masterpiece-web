import React, { useMemo, useState } from "react";
import {
  Trophy, Activity, TrendingUp, AlertTriangle, ShieldCheck,
  ChevronDown, Info, Clock, MapPin, Droplets, Target, Zap, Flame,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import RACE_DATA from "./data/race_data.json";

const BRACKET_COLORS = {
  1: "bg-white text-black", 2: "bg-black text-white border border-zinc-600",
  3: "bg-red-600 text-white", 4: "bg-blue-600 text-white",
  5: "bg-yellow-400 text-black", 6: "bg-green-600 text-white",
  7: "bg-orange-500 text-white", 8: "bg-pink-400 text-black",
};
const MARK_STYLE = {
  "◎": "text-yellow-300 border-yellow-400/60 bg-yellow-400/10",
  "◯": "text-cyan-300 border-cyan-400/60 bg-cyan-400/10",
  "▲": "text-purple-300 border-purple-400/60 bg-purple-400/10",
  "☆": "text-amber-300 border-amber-400/60 bg-amber-400/10",
  "△": "text-zinc-300 border-zinc-500/60 bg-zinc-500/10",
  "穴": "text-rose-300 border-rose-400/60 bg-rose-400/10",
};
const SORTS = [
  { key: "pred", label: "予測順位", fn: (a, b) => a.pred_rank - b.pred_rank },
  { key: "pwin", label: "正準勝率", fn: (a, b) => b.p_benter - a.p_benter },
  { key: "odds", label: "単勝オッズ", fn: (a, b) => a.odds_win - b.odds_win },
  { key: "kelly", label: "1/4ケリー", fn: (a, b) => b.kelly_1_4 - a.kelly_1_4 || b.ev_win - a.ev_win },
];

const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

function Card({ className = "", children }) {
  return <div className={`rounded-xl border border-zinc-800 bg-zinc-900/90 ${className}`}>{children}</div>;
}

function Chip({ className = "", children }) {
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

function Header() {
  const r = RACE_DATA.race_info;
  const t = RACE_DATA.track_rheology;
  const post = new Date(r.post_time);
  const hhmm = post.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
  const dateStr = post.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" });
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-300">
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-widest">MASTERPIECE ANALYTICS TERMINAL</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-zinc-50 sm:text-2xl">{r.race_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{r.course}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{dateStr} {hhmm} 発走</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip className="border-amber-400/40 bg-amber-500/10 text-amber-300">
            <Droplets className="h-3.5 w-3.5" />芝：{t.condition}
          </Chip>
          <Chip className="border-cyan-400/40 bg-cyan-500/10 font-mono text-cyan-300">
            クッション値 {t.cushion_value.toFixed(1)}
          </Chip>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="shrink-0 text-xs text-emerald-300">SHA-256 Merkle Seal</span>
        <code className="min-w-0 truncate font-mono text-xs text-zinc-400" title={r.merkle_seal}>{r.merkle_seal}</code>
      </div>
    </Card>
  );
}

function RheologyCard() {
  const t = RACE_DATA.track_rheology;
  const [open, setOpen] = useState(true);
  const stats = [
    ["クッション値", t.cushion_value.toFixed(1)],
    ["含水率 G前", `${t.turf_moisture_goal_pct}%`],
    ["含水率 4角", `${t.turf_moisture_4c_pct}%`],
    ["実効ΔT", `+${t.effective_track_delta_t_sec.toFixed(2)}s`],
  ];
  return (
    <Card>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <span className="flex items-center gap-2 font-semibold text-zinc-100">
          <Activity className="h-4 w-4 text-cyan-400" />馬場バイオメカニクス ＆ 展開解説
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-zinc-800 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-zinc-950/60 p-3">
                <div className="text-xs text-zinc-500">{k}</div>
                <div className="font-mono text-lg text-zinc-100">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{t.tactical_conclusion}</p>
        </div>
      )}
    </Card>
  );
}

function Detail({ h }) {
  const radar = RACE_DATA.k7_basis_labels.map((l, i) => ({
    axis: l.split(":")[0].trim().toUpperCase(),
    label: l,
    value: Math.round(h.f_raw[i] * 1000) / 10,
  }));
  const cw = h.post_workout_wt - h.prev_wt;
  return (
    <div className="grid gap-4 border-t border-zinc-800 bg-zinc-950/50 p-4 lg:grid-cols-2">
      <div>
        <div className="mb-1 text-xs font-semibold text-zinc-400">K=7 直交基底</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
              <PolarRadiusAxis domain={[60, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#34d399" fill="#10b981" fillOpacity={0.3} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
                formatter={(v) => [v.toFixed(1), "スコア"]}
                labelFormatter={(l) => radar.find((r) => r.axis === l)?.label}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-zinc-500">
          {radar.map((r) => <div key={r.axis}>{r.axis}<div className="text-zinc-300">{r.value.toFixed(0)}</div></div>)}
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1 text-xs font-semibold text-zinc-400">調教・馬体バイオメトリクス所見</div>
          <p className="leading-relaxed text-zinc-300">{h.workout_note}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-3">
          {[
            ["馬体重", `${h.prev_wt}→${h.post_workout_wt} (${cw >= 0 ? "+" : ""}${cw})`],
            ["BCS", `${h.bcs.toFixed(3)} (${h.bcs_color})`],
            ["W_sink", h.w_sink_factor.toFixed(3)],
            ["LCR", h.lcr.toFixed(3)],
            ["EOM", h.eom.toFixed(3)],
            ["Γ_B", h.gamma_b.toFixed(3)],
            ["S_base", h.s_base.toFixed(2)],
            ["R_fp_lb", h.r_fp_lb.toFixed(1)],
            ["Top3推定", pct(h.p_top3_est)],
          ].map(([k, v]) => (
            <div key={k} className="rounded bg-zinc-900 p-2">
              <div className="text-zinc-500">{k}</div><div className="text-zinc-200">{v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="mb-1 text-xs font-semibold text-zinc-400">血統</div>
          <div className="text-zinc-200">{h.sire} × {h.bms}（母父）</div>
          <div className="mt-2 text-xs font-semibold text-zinc-400">SCL [C, L, S]</div>
          <div className="font-mono text-zinc-200">{h.scl.map((v) => v.toFixed(2)).join(" / ")}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 p-3 font-mono text-xs">
          <div className="mb-1 font-sans text-xs font-semibold text-zinc-400">勝率 90%信頼区間 (CI 90%)</div>
          <div className="text-zinc-200">
            [{pct(h.ci_90[0])}, {pct(h.ci_90[1])}]
            <span className="ml-2 text-zinc-500">正準 {pct(h.p_benter)} / FP {pct(h.p_fp)}</span>
          </div>
          {(h.p_fp < h.ci_90[0] || h.p_fp > h.ci_90[1]) && (
            <div className="mt-1 flex items-start gap-1 font-sans text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              FP推定値がCI外 — モデル間乖離の可能性
            </div>
          )}
          <div className="mt-1 font-sans text-zinc-500">
            重馬場補正(9.2): 正準 {pct(h.p_benter_heavy_92)} / EV {h.ev_win_heavy_92.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}

function HorseRow({ h, open, onToggle }) {
  const evHi = h.ev_win > 1.0;
  const smHi = h.smart_money_ratio >= 1.5;
  return (
    <div className={`rounded-xl border bg-zinc-900/90 transition-colors ${open ? "border-emerald-500/40" : "border-zinc-800"}`}>
      <button onClick={onToggle} className="w-full p-3 text-left sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:flex-nowrap">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg font-bold ${MARK_STYLE[h.mark]}`}>{h.mark}</span>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-mono text-sm font-bold ${BRACKET_COLORS[h.bracket]}`}>{h.num}</span>
          <div className="min-w-[10rem] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-50">{h.name}</span>
              {smHi && <Chip className="border-rose-400/40 bg-rose-500/10 text-rose-300"><Flame className="h-3 w-3" />穴SM</Chip>}
            </div>
            <div className="text-xs text-zinc-500">{h.jockey}（{h.trainer}）· 枠{h.bracket}</div>
            <Chip className="mt-1 border-purple-400/30 bg-purple-500/10 text-purple-300">{h.scl_type}</Chip>
          </div>

          <div className="w-full min-w-[9rem] lg:w-44">
            <div className="flex justify-between text-xs text-zinc-500"><span>P_win</span><span className="font-mono text-zinc-200">{pct(h.p_benter)}</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-800">
              <div className="h-full rounded bg-emerald-500" style={{ width: `${Math.min(100, h.p_benter * 100 * 2.5)}%` }} />
            </div>
          </div>

          <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-1 font-mono text-sm sm:grid-cols-6 lg:flex-none">
            <Stat label="単勝" value={h.odds_win.toFixed(1)} />
            <Stat label="EV" value={h.ev_win.toFixed(3)} cls={evHi ? "text-emerald-400" : "text-rose-400"} bg={evHi ? "bg-emerald-500/10" : ""} />
            <Stat label="1/4 Kelly" value={h.kelly_1_4 > 0 ? pct(h.kelly_1_4) : "—"} cls={h.kelly_1_4 > 0 ? "text-emerald-300 font-bold" : "text-zinc-600"} bg={h.kelly_1_4 > 0 ? "bg-emerald-500/10" : ""} />
            <Stat label="SM_i" value={h.smart_money_ratio.toFixed(2)} cls={smHi ? "text-amber-400" : "text-zinc-300"} />
            <Stat label="SCR" value={h.scr_heavy_aptitude.toFixed(3)} />
            <Stat label="Δd" value={`${h.derby_room_delta_d_m.toFixed(1)}m`} />
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <Detail h={h} />}
    </div>
  );
}

function Stat({ label, value, cls = "text-zinc-200", bg = "" }) {
  return (
    <div className={`rounded px-1.5 py-0.5 text-right lg:w-16 ${bg}`}>
      <div className="font-sans text-[10px] text-zinc-500">{label}</div>
      <div className={cls}>{value}</div>
    </div>
  );
}

function Portfolio({ horses }) {
  const axis = horses.find((h) => h.pred_rank === 1);
  const maxKelly = [...horses].sort((a, b) => b.kelly_1_4 - a.kelly_1_4)[0];
  const smPicks = horses.filter((h) => h.smart_money_ratio >= 1.5 && h.ev_win > 1.0 && h.num !== maxKelly.num);
  const totalKelly = horses.reduce((s, h) => s + h.kelly_1_4, 0);
  const barData = horses.filter((h) => h.kelly_1_4 > 0).map((h) => ({ name: `${h.num} ${h.name}`, v: +(h.kelly_1_4 * 100).toFixed(1) }));

  const Box = ({ icon: Icon, title, tone, children }) => (
    <Card className={`p-4 ${tone}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" />{title}</div>
      {children}
    </Card>
  );
  const Line = ({ h }) => (
    <div className="flex items-center justify-between border-t border-zinc-800/70 py-1.5 text-sm first:border-0">
      <span className="text-zinc-200">{h.mark} {h.num} {h.name}</span>
      <span className="font-mono text-xs text-zinc-400">
        単{h.odds_win.toFixed(1)} · EV {h.ev_win.toFixed(2)} · 複EV {h.ev_place.toFixed(2)} · <span className="text-emerald-300">{h.kelly_1_4 > 0 ? pct(h.kelly_1_4) : "0%"}</span>
      </span>
    </div>
  );

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-300"><Target className="h-4 w-4 text-emerald-400" />推奨ポートフォリオ（1/4ケリー）</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        <Box icon={Trophy} title="本命軸" tone="text-yellow-300">
          <Line h={axis} />
          <p className="mt-2 text-xs text-zinc-500">勝率首位だがEV {axis.ev_win.toFixed(2)} は薄く、配分は {pct(axis.kelly_1_4)}。複勝EV {axis.ev_place.toFixed(2)} が相対的に厚い。</p>
        </Box>
        <Box icon={TrendingUp} title="期待値妙味（最大ケリー）" tone="text-emerald-300">
          <Line h={maxKelly} />
          <p className="mt-2 text-xs text-zinc-500">単勝EVが最大。ただし的中確率は {pct(maxKelly.p_benter)} と低く、CI下限 {pct(maxKelly.ci_90[0])} ベースでは優位が縮小する点に留意。</p>
        </Box>
        <Box icon={Zap} title="穴スマートマネー" tone="text-rose-300">
          {smPicks.map((h) => <Line key={h.num} h={h} />)}
          <p className="mt-2 text-xs text-zinc-500">SM_i ≥ 1.5 かつ EV &gt; 1。流入シグナルと正準勝率の乖離が根拠。</p>
        </Box>
      </div>
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span>推奨単勝配分（資金比%）</span>
          <span className="font-mono text-emerald-300">合計 {pct(totalKelly)}</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#d4d4d8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }} formatter={(v) => [`${v}%`, "1/4 Kelly"]} />
              <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                {barData.map((d, i) => <Cell key={i} fill="#10b981" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

export default function App() {
  const [sortKey, setSortKey] = useState("pred");
  const [openNum, setOpenNum] = useState(null);
  const horses = useMemo(() => {
    const fn = SORTS.find((s) => s.key === sortKey).fn;
    return [...RACE_DATA.horses].sort(fn);
  }, [sortKey]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-6xl space-y-4 p-3 sm:p-6">
        <Header />
        <RheologyCard />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-300">
              <Activity className="h-4 w-4 text-cyan-400" />出走馬 マスターピース・コア一覧
              <span className="font-mono text-xs text-zinc-500">{horses.length}頭</span>
            </h2>
            <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              {SORTS.map((s) => (
                <button key={s.key} onClick={() => setSortKey(s.key)}
                  className={`rounded-md px-3 py-1 text-xs transition-colors ${sortKey === s.key ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {horses.map((h) => (
              <HorseRow key={h.num} h={h} open={openNum === h.num} onToggle={() => setOpenNum(openNum === h.num ? null : h.num)} />
            ))}
          </div>
          <div className="flex items-start gap-2 text-xs text-zinc-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            P_win は正準勝率（p_benter）。EV &gt; 1.0 をグリーン、SM_i ≥ 1.5 を「穴SM」表示。1/4ケリーは単勝ベース。
          </div>
        </section>

        <Portfolio horses={RACE_DATA.horses} />
      </div>
    </div>
  );
}
