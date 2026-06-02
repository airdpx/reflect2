import type { AppState, NumerologyResult } from "../types";
import { getNumerology, numerologyTone } from "../lib/numerology";

export function TodayNumerologyPanel({ state }: { state: AppState }) {
  if (!state.settings.numerology.enabled || !state.settings.numerology.showInToday) return null;
  const numerology = getNumerology(state.selectedDate, state.profile?.birthDate || "", state.settings.numerology);
  if (!numerology) return null;
  return <NumerologyShell title="Цифры" numerology={numerology} displayMode={state.settings.numerology.displayMode} compact={state.settings.numerology.displayMode !== "cards"} visibleMetrics={state.settings.numerology.visibleMetrics} />;
}

export function DiaryNumerologyStrip({ state }: { state: AppState }) {
  if (!state.settings.numerology.enabled || !state.settings.numerology.showInDiary) return null;
  const numerology = getNumerology(state.selectedDate, state.profile?.birthDate || "", state.settings.numerology);
  if (!numerology) return null;
  const tone = numerologyTone(numerology.summaryScore);
  const visibleMetrics = numerology.metrics.filter((metric) => state.settings.numerology.visibleMetrics[metric.id]);
  return (
    <div className={`forecast-strip numerology-strip forecast-tone-${tone} numerology-mode-${state.settings.numerology.displayMode}`}>
      <span>Цифры: {numerology.summaryLabel}</span>
      <b>{numerology.summaryScore}%</b>
      <div>
        {visibleMetrics.length ? visibleMetrics.map((metric) => (
          <i key={metric.id} title={`${metric.label}: ${metric.value} · ${metric.interpretation}`}>
            {metricShortLabel(metric.id)} {metric.value}
          </i>
        )) : <i title="Все параметры скрыты">Скрыто</i>}
      </div>
    </div>
  );
}

export function InspectorNumerologySummary({ state, allowToday = false }: { state: AppState; allowToday?: boolean }) {
  if (!state.settings.numerology.enabled || !state.settings.numerology.showInInspector || (!allowToday && state.view === "today")) return null;
  const numerology = getNumerology(state.selectedDate, state.profile?.birthDate || "", state.settings.numerology);
  if (!numerology) return null;
  return (
    <div className="panel inspector-panel numerology-inspector-panel">
      <h3>Цифры</h3>
      <div className={`forecast-score forecast-tone-${numerologyTone(numerology.summaryScore)}`}>
        <strong>{numerology.summaryScore}%</strong>
        <span>{numerology.summaryLabel}</span>
      </div>
      <div className="mini-metrics numerology-mini-metrics">
        {numerology.metrics.filter((metric) => state.settings.numerology.visibleMetrics[metric.id]).length ? numerology.metrics.filter((metric) => state.settings.numerology.visibleMetrics[metric.id]).map((metric) => (
          <span key={metric.id}>
            {metric.label} <b>{metric.value}</b>
          </span>
        )) : <span>Параметры скрыты</span>}
      </div>
      <p className="numerology-recommendation">{numerology.recommendation}</p>
    </div>
  );
}

function NumerologyShell({
  title,
  numerology,
  displayMode,
  compact,
  visibleMetrics
}: {
  title: string;
  numerology: NumerologyResult;
  displayMode: AppState["settings"]["numerology"]["displayMode"];
  compact: boolean;
  visibleMetrics: AppState["settings"]["numerology"]["visibleMetrics"];
}) {
  const tone = numerologyTone(numerology.summaryScore);
  const metrics = numerology.metrics.filter((metric) => visibleMetrics[metric.id]);
  return (
    <div className={`panel forecast-panel numerology-panel numerology-mode-${displayMode} ${compact ? "compact-numerology-panel" : ""}`}>
      <div className="section-head">
        <div>
          <h3>{title}</h3>
        </div>
        <div className={`forecast-score forecast-tone-${tone}`}>
          <strong>{numerology.summaryScore}%</strong>
          <span>{numerology.summaryLabel}</span>
        </div>
      </div>
      {metrics.length ? (
        <div className={`numerology-metric-grid numerology-metric-grid-${displayMode}`}>
          {metrics.map((metric) => (
            <article className={`numerology-metric-card phase-${tone}`} key={metric.id}>
              <div className="numerology-metric-head">
                <span>{metric.label}</span>
                <b>{metric.value}</b>
              </div>
              <small>{metric.interpretation}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty numerology-empty">Все параметры скрыты в настройках.</div>
      )}
      <p className="numerology-recommendation">{numerology.recommendation}</p>
    </div>
  );
}

function metricShortLabel(id: NumerologyResult["metrics"][number]["id"]) {
  switch (id) {
    case "personalDay":
      return "PD";
    case "personalMonth":
      return "PM";
    case "personalYear":
      return "PY";
    case "lifePath":
      return "LP";
    default:
      return id;
  }
}
