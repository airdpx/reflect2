import { useEffect, useMemo, useState } from "react";
import type { AppActions, AppState, ForecastResult, ForecastScale, HumanDesignTransit } from "../types";
import { forecastTone, getForecast } from "../lib/forecast";

export function TodayForecastPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInToday) return null;
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "");
  return (
    <ForecastShell title="Прогноз дня" forecast={forecast} mode={state.settings.forecast.displayMode} onSettings={() => actions.setView("settings")} />
  );
}

export function DiaryForecastStrip({ state, actions }: { state: AppState; actions: AppActions }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInDiary) return null;
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "");
  if (!forecast) {
    return (
      <div className="forecast-strip empty-forecast">
        <span>Прогноз дня</span>
        <button onClick={() => actions.setView("settings")}>указать дату рождения</button>
      </div>
    );
  }
  const tone = forecastTone(forecast.summaryScore);
  if (forecast.source === "humanDesign") {
    return (
      <div className="forecast-strip forecast-tone-steady">
        <span>Human Design: текущий транзит</span>
      </div>
    );
  }
  return (
    <div className={`forecast-strip forecast-tone-${tone}`}>
      <span>Биоритмы: {forecast.summaryLabel}</span>
      <b>{forecast.summaryScore}%</b>
      <div>{forecast.scales.map((scale) => <ForecastPill key={scale.id} scale={scale} />)}</div>
    </div>
  );
}

export function InspectorForecastSummary({ state }: { state: AppState }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInInspector) return null;
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "");
  const tone = forecast ? forecastTone(forecast.summaryScore) : "steady";
  return (
    <div className="panel inspector-panel">
      <h3>Прогноз дня</h3>
      {forecast ? (
        forecast.source === "humanDesign" ? (
          <p className="muted">Human Design · текущий транзит Humdes.</p>
        ) : (
          <>
            <div className={`forecast-score forecast-tone-${tone}`}><strong>{forecast.summaryScore}%</strong><span>{forecast.summaryLabel}</span></div>
            <div className="mini-metrics">
              {forecast.scales.map((scale) => <span key={scale.id}>{scale.label} <b>{scale.value}</b></span>)}
            </div>
          </>
        )
      ) : <p className="muted">Для прогноза нужна дата рождения.</p>}
    </div>
  );
}

function ForecastShell({
  title,
  forecast,
  mode,
  onSettings
}: {
  title: string;
  forecast: ForecastResult | null;
  mode: "compact" | "cards" | "minimal";
  onSettings: () => void;
}) {
  const isHumanDesign = forecast?.source === "humanDesign";
  const { transit, loading: transitLoading, error: transitError } = useHumanDesignTransit(isHumanDesign ? forecast.date : "");

  if (!forecast) {
    return (
      <div className="panel forecast-panel empty-forecast">
        <div>
          <h3>{title}</h3>
          <p className="muted">Для прогноза нужна дата рождения.</p>
        </div>
        <button className="btn ghost" onClick={onSettings}>Настроить</button>
      </div>
    );
  }
  const tone = forecastTone(forecast.summaryScore);
  return (
    <div className={`panel forecast-panel forecast-mode-${mode}`}>
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{isHumanDesign ? "Human Design · текущий транзит Солнца и Земли." : "Биоритмы · ориентир для самонаблюдения, без давления."}</p>
        </div>
        {!isHumanDesign && <div className={`forecast-score forecast-tone-${tone}`}>
          <strong>{forecast.summaryScore}%</strong>
          <span>{forecast.summaryLabel}</span>
        </div>}
      </div>
      {isHumanDesign ? (
        <HumanDesignTransitBlock transit={transit} loading={transitLoading} error={transitError} />
      ) : mode !== "minimal" && <div className="forecast-scales">{forecast.scales.map((scale) => <ForecastScaleRow key={scale.id} scale={scale} />)}</div>}
    </div>
  );
}

function useHumanDesignTransit(date: string) {
  const [transit, setTransit] = useState<HumanDesignTransit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestUrl = useMemo(() => date ? `/api/hd-transit?date=${encodeURIComponent(date)}` : "", [date]);

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

function HumanDesignTransitBlock({ transit, loading, error }: { transit: HumanDesignTransit | null; loading: boolean; error: string }) {
  if (loading && !transit) return <p className="muted">Загружаю текущий транзит...</p>;
  if (error) return <p className="muted">Транзит Humdes временно недоступен: {error}</p>;
  if (!transit) return <p className="muted">Нет данных транзита для выбранной даты.</p>;

  return (
    <div className="hd-transit">
      <div className="hd-transit-title">{transit.title}</div>
      <div className="hd-transit-gates">
        {transit.gates.map((gate) => (
          <a href={gate.url} target="_blank" rel="noreferrer" key={`${gate.number}-${gate.name}`}>
            <strong>{gate.number}</strong>
            <span>{gate.name}</span>
          </a>
        ))}
      </div>
      {transit.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <a className="hd-transit-source" href={transit.sourceUrl} target="_blank" rel="noreferrer">Источник: Humdes</a>
    </div>
  );
}

function ForecastScaleRow({ scale }: { scale: ForecastScale }) {
  return (
    <div className={`forecast-scale phase-${scale.phase}`}>
      <span>{scale.label}</span>
      <div><i style={{ width: `${scale.value}%` }} /></div>
      <b>{scale.value}</b>
    </div>
  );
}

function ForecastPill({ scale }: { scale: ForecastScale }) {
  return <i className={`forecast-pill phase-${scale.phase}`} title={`${scale.label}: ${scale.value}`}>{scale.value}</i>;
}
