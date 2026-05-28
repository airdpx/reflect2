import type { AppActions, AppState, ForecastResult, ForecastScale } from "../types";
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
  return (
    <div className={`forecast-strip forecast-tone-${tone}`}>
      <span>Прогноз: {forecast.summaryLabel}</span>
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
        <>
          <div className={`forecast-score forecast-tone-${tone}`}><strong>{forecast.summaryScore}%</strong><span>{forecast.summaryLabel}</span></div>
          <div className="mini-metrics">
            {forecast.scales.map((scale) => <span key={scale.id}>{scale.label} <b>{scale.value}</b></span>)}
          </div>
        </>
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
          <p className="muted">Ориентир для самонаблюдения, без давления.</p>
        </div>
        <div className={`forecast-score forecast-tone-${tone}`}>
          <strong>{forecast.summaryScore}%</strong>
          <span>{forecast.summaryLabel}</span>
        </div>
      </div>
      {mode !== "minimal" && <div className="forecast-scales">{forecast.scales.map((scale) => <ForecastScaleRow key={scale.id} scale={scale} />)}</div>}
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
