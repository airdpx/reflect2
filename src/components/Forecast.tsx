import { useEffect, useState } from "react";
import type { AppActions, AppState, ForecastResult, ForecastScale, HumanDesignTransit } from "../types";
import { formatDate } from "../lib/date";
import { forecastTone, getForecast } from "../lib/forecast";
import { normalizeLanguage } from "../lib/i18n";
import { useRuntimeContent } from "./RuntimeContent";

export function TodayForecastPanel({ state, actions }: { state: AppState; actions: AppActions }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInToday) return null;
  const language = normalizeLanguage(state.settings.language);
  const { content } = useRuntimeContent();
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "", language, content);
  if (!forecast) return null;
  return <ForecastShell title={language === "en" ? "Biorhythms" : "Биоритмы"} forecast={forecast} />;
}

export function DiaryForecastStrip({ state, actions }: { state: AppState; actions: AppActions }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInDiary) return null;
  const language = normalizeLanguage(state.settings.language);
  const { content } = useRuntimeContent();
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "", language, content);
  if (!forecast) return null;
  const tone = forecastTone(forecast.summaryScore);
  return (
    <div className={`forecast-strip forecast-tone-${tone}`}>
      <span>{language === "en" ? "Biorhythms" : "Биоритмы"}: {forecast.summaryLabel}</span>
      <b>{forecast.summaryScore}%</b>
      <div>{forecast.scales.map((scale) => <ForecastPill key={scale.id} scale={scale} />)}</div>
    </div>
  );
}

export function InspectorForecastSummary({ state }: { state: AppState }) {
  if (!state.settings.forecast.enabled || !state.settings.forecast.showInInspector || state.view === "today") return null;
  const language = normalizeLanguage(state.settings.language);
  const { content } = useRuntimeContent();
  const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "", language, content);
  if (!forecast) return null;
  const tone = forecastTone(forecast.summaryScore);
  return (
    <div className="panel inspector-panel">
      <h3>{language === "en" ? "Day Forecast" : "Прогноз дня"}</h3>
      <div className={`forecast-score forecast-tone-${tone}`}><strong>{forecast.summaryScore}%</strong><span>{forecast.summaryLabel}</span></div>
      <div className="mini-metrics">
        {forecast.scales.map((scale) => <span key={scale.id}>{scale.label} <b>{scale.value}</b></span>)}
      </div>
    </div>
  );
}

export function TransitPanel({ state }: { state: AppState }) {
  if (!state.settings.visibleBlocks.transit) return null;
  const language = normalizeLanguage(state.settings.language);
  const { transit, loading, error } = useHumanDesignTransit(language, state.selectedDate);
  if (loading && !transit) return null;
  if (error || !transit) return null;
  const periodStart = formatDisplayDate(transit.periodStart);
  const periodEnd = formatDisplayDate(transit.periodEnd);
  return (
    <div className="panel transit-panel">
      <div className="section-head">
        <div>
          <h3 className="transit-panel-title">{language === "en" ? "Transit HD" : "Транзит HD"} <span>({periodStart} — {periodEnd})</span></h3>
        </div>
      </div>
      <HumanDesignTransitBlock transit={transit} language={language} />
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

function useHumanDesignTransit(language: ReturnType<typeof normalizeLanguage>, date: string) {
  const [transit, setTransit] = useState<HumanDesignTransit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestUrl = `/api/hd-transit?language=${language}&date=${date}`;

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

function HumanDesignTransitBlock({ transit, language }: { transit: HumanDesignTransit; language: ReturnType<typeof normalizeLanguage> }) {
  const paragraphs = language === "en"
    ? transit.paragraphs
    : transit.paragraphs.filter((paragraph) => !/^Текущий транзит/i.test(paragraph) && !/Humdes/i.test(paragraph));
  return (
    <div className="hd-transit">
      <div className="hd-transit-gates">
        {transit.gates.map((gate) => (
          <div key={`${gate.number}-${gate.name}`}>
            <strong>{gate.number}</strong>
            <span>{gate.name}</span>
          </div>
        ))}
      </div>
      {paragraphs.length ? (
        <div className="hd-transit-copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      ) : null}
      {(transit.helped?.length || transit.blocked?.length) ? (
        <div className="hd-transit-traits">
          {transit.helped?.length ? (
            <div className="hd-transit-trait-group">
              <h4>{language === "en" ? "What helps" : "Помогают"}</h4>
              <div className="hd-transit-trait-lines">
                {transit.helped.map((item, index) => (
                  <div key={`help-${index}`} className="hd-transit-trait-line">
                    <span className="hd-transit-trait-bullet" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {transit.blocked?.length ? (
            <div className="hd-transit-trait-group">
              <h4>{language === "en" ? "What hinders" : "Мешают"}</h4>
              <div className="hd-transit-trait-lines">
                {transit.blocked.map((item, index) => (
                  <div key={`block-${index}`} className="hd-transit-trait-line">
                    <span className="hd-transit-trait-bullet" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="hd-transit-links">
        <a className="hd-transit-source" href={transit.descriptionUrl} target="_blank" rel="noreferrer">{language === "en" ? "Description" : "Описание"}</a>
      </div>
    </div>
  );
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
