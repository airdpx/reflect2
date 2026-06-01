import { useEffect, useState } from "react";
import type { AppActions, AppState, ForecastResult, ForecastScale, HumanDesignTransit } from "../types";
import { formatDate } from "../lib/date";
import { forecastTone, getForecast } from "../lib/forecast";

export function TodayForecastPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInToday) return null;
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "");
  if (!forecast) return null;
  return <ForecastShell title="Биоритмы" forecast={forecast} />;
}

export function DiaryForecastStrip({ state, actions }: { state: AppState; actions: AppActions }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInDiary) return null;
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "");
  if (!forecast) return null;
  const tone = forecastTone(forecast.summaryScore);
  return (
    <div className={`forecast-strip forecast-tone-${tone}`}>
      <span>Биоритмы: {forecast.summaryLabel}</span>
      <b>{forecast.summaryScore}%</b>
      <div>{forecast.scales.map((scale) => <ForecastPill key={scale.id} scale={scale} />)}</div>
    </div>
  );
}

export function InspectorForecastSummary({ state }: { state: AppState }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInInspector || state.view === "today") return null;
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "");
  if (!forecast) return null;
  const tone = forecastTone(forecast.summaryScore);
  return (
    <div className="panel inspector-panel">
      <h3>Прогноз дня</h3>
      <div className={`forecast-score forecast-tone-${tone}`}><strong>{forecast.summaryScore}%</strong><span>{forecast.summaryLabel}</span></div>
      <div className="mini-metrics">
        {forecast.scales.map((scale) => <span key={scale.id}>{scale.label} <b>{scale.value}</b></span>)}
      </div>
    </div>
  );
}

export function TransitPanel({ state }: { state: AppState }) {
  if (!state.settings.visibleBlocks.transit) return null;
  const { transit, loading, error } = useHumanDesignTransit();
  if (loading && !transit) return null;
  if (error || !transit) return null;
  return (
    <div className="panel transit-panel">
      <div className="section-head">
        <div>
          <h3>Транзит</h3>
          <p className="muted">Текущий транзит из базы Humdes с датами и ссылками на описание.</p>
        </div>
      </div>
      <HumanDesignTransitBlock transit={transit} />
    </div>
  );
}

function ForecastShell({
  title,
  forecast,
  }: {
  title: string;
  forecast: ForecastResult;
  }) {
  const tone = forecastTone(forecast.summaryScore);
  return (
    <div className="panel forecast-panel">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
        </div>
        <div className={`forecast-score forecast-tone-${tone}`}>
          <strong>{forecast.summaryScore}%</strong>
          <span>{forecast.summaryLabel}</span>
        </div>
      </div>
      <div className="forecast-scales">{forecast.scales.map((scale) => <ForecastScaleRow key={scale.id} scale={scale} />)}</div>
    </div>
  );
}

function useHumanDesignTransit() {
  const [transit, setTransit] = useState<HumanDesignTransit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestUrl = "/api/hd-transit";

  useEffect(() => {
    if (!requestUrl) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(requestUrl, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Не удалось загрузить транзит.");
        setTransit(payload);
      })
      .catch((caught) => {
        if ((caught as Error).name !== "AbortError") {
          setTransit(null);
          setError((caught as Error).message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestUrl]);

  return { transit, loading, error };
}

function HumanDesignTransitBlock({ transit }: { transit: HumanDesignTransit }) {
  const periodStart = formatDisplayDate(transit.periodStart);
  const periodEnd = formatDisplayDate(transit.periodEnd);
  const title = compactTransitTitle(transit.title);
  const titleWithDates = `${title} (${periodStart} — ${periodEnd})`;
  return (
    <div className="hd-transit">
      <div className="hd-transit-top">
        <div className="hd-transit-title">{titleWithDates}</div>
      </div>
      <div className="hd-transit-gates">
        {transit.gates.map((gate) => (
          <div key={`${gate.number}-${gate.name}`}>
            <strong>{gate.number}</strong>
            <span>{gate.name}</span>
          </div>
        ))}
      </div>
      {transit.paragraphs.length ? (
        <div className="hd-transit-copy">
          {transit.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      ) : null}
      <div className="hd-transit-links">
        <a className="hd-transit-source" href={transit.descriptionUrl} target="_blank" rel="noreferrer">Описание транзита</a>
      </div>
    </div>
  );
}

function compactTransitTitle(value: string) {
  const normalized = value.trim();
  if (/^Транзит\s+с\s+.+\s+по\s+.+$/i.test(normalized)) {
    return "Транзит";
  }
  return normalized;
}

function ForecastScaleRow({ scale }: { scale: ForecastScale }) {
  return (
    <div className={`forecast-scale phase-${scale.phase}`}>
      <div className="forecast-scale-label">
        <span>{scale.label}</span>
        <b>{scale.value}%</b>
      </div>
      <div className="forecast-scale-track">
        <i style={{ width: `${scale.value}%` }} />
        <em style={{ left: `${scale.value}%` }} />
      </div>
    </div>
  );
}

function ForecastPill({ scale }: { scale: ForecastScale }) {
  return <i className={`forecast-pill phase-${scale.phase}`} title={`${scale.label}: ${scale.value}`}>{scale.value}</i>;
}

function ForecastMiniScale({ scale }: { scale: ForecastScale }) {
  return (
    <div className={`forecast-mini-scale phase-${scale.phase}`}>
      <span>{scale.label}</span>
      <b>{scale.value}%</b>
    </div>
  );
}

function formatDisplayDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDate(value, "short");
  }
  return value;
}
