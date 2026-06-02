export type AppIconName =
  | "today"
  | "calendar"
  | "habits"
  | "diary"
  | "notifications"
  | "analytics"
  | "forecast"
  | "settings"
  | "management"
  | "user"
  | "user-plus"
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "key"
  | "shield"
  | "bolt"
  | "check"
  | "edit"
  | "trash"
  | "ban"
  | "database"
  | "download"
  | "palette";

export function AppIcon({ name }: { name: AppIconName | string }) {
  const line = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  const soft = "var(--icon-soft, color-mix(in srgb, currentColor 18%, transparent))";
  const warm = "var(--icon-warm, #f6a800)";
  const cool = "var(--icon-cool, #3ee3d5)";
  const green = "var(--icon-green, #9be33f)";
  const violet = "var(--icon-violet, #a855f7)";

  return (
    <svg className="app-svg-icon" viewBox="0 0 48 48" aria-hidden="true">
      {name === "calendar" ? (
        <>
          <rect x="8" y="10" width="32" height="32" rx="7" fill={soft} />
          <path {...line} d="M15 6v8M33 6v8M9 18h30" stroke={cool} />
          <rect x="14" y="23" width="5" height="5" rx="1.5" fill={cool} />
          <rect x="23" y="23" width="5" height="5" rx="1.5" fill={green} />
          <rect x="32" y="23" width="5" height="5" rx="1.5" fill={warm} />
          <rect x="14" y="32" width="5" height="5" rx="1.5" fill={violet} />
          <rect x="23" y="32" width="5" height="5" rx="1.5" fill={cool} />
          <path {...line} d="M8 17V40a2 2 0 0 0 2 2h30" />
        </>
      ) : name === "diary" ? (
        <>
          <path d="M13 8h24a3 3 0 0 1 3 3v32H15a5 5 0 0 1-5-5V11a3 3 0 0 1 3-3Z" fill={soft} />
          <path {...line} d="M16 8v35M16 39h24M22 16h14M22 23h11M22 30h14" stroke={violet} />
          <path {...line} d="M10 38c0-3 2-5 5-5h25" />
          <circle cx="34" cy="17" r="2.5" fill={cool} />
        </>
      ) : name === "analytics" ? (
        <>
          <path d="M8 39h34v4H8z" fill={soft} />
          <rect x="10" y="27" width="6" height="12" rx="2" fill={cool} />
          <rect x="22" y="20" width="6" height="19" rx="2" fill={green} />
          <rect x="34" y="12" width="6" height="27" rx="2" fill={warm} />
          <path {...line} d="M7 24c5-1 7-8 13-7 4 1 4 6 8 6 5 0 6-10 13-12" stroke={green} />
          <path {...line} d="M9 42h34" />
        </>
      ) : name === "forecast" ? (
        <>
          <path d="M8 35c5-13 12-17 21-9 5 5 9 2 12-7v18H8Z" fill={soft} />
          <path {...line} d="M7 34c6-13 13-17 21-9 5 5 9 2 13-8" stroke={warm} />
          <circle cx="12" cy="30" r="3" fill={cool} />
          <circle cx="27" cy="24" r="3" fill={violet} />
          <circle cx="40" cy="18" r="3" fill={warm} />
          <path {...line} d="M7 40h36" />
        </>
      ) : name === "settings" ? (
        <>
          <circle cx="24" cy="24" r="7" fill={soft} />
          <path {...line} d="M24 7v6M24 35v6M7 24h6M35 24h6M11.5 11.5l4.2 4.2M32.3 32.3l4.2 4.2M36.5 11.5l-4.2 4.2M15.7 32.3l-4.2 4.2" stroke={cool} />
          <circle cx="24" cy="24" r="5" fill={warm} />
          <circle cx="24" cy="24" r="2" fill={green} />
        </>
      ) : name === "management" ? (
        <>
          <rect x="8" y="11" width="34" height="30" rx="7" fill={soft} />
          <path {...line} d="M15 19h20M15 27h20M15 35h12" />
          <circle cx="14" cy="19" r="2.5" fill={cool} />
          <circle cx="14" cy="27" r="2.5" fill={warm} />
          <circle cx="14" cy="35" r="2.5" fill={green} />
          <path {...line} d="M33 31l3 3 6-7" stroke={green} />
        </>
      ) : name === "today" ? (
        <>
          <circle cx="24" cy="24" r="9" fill={warm} />
          <path {...line} d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4 4M33.5 33.5l4 4M37.5 10.5l-4 4M14.5 33.5l-4 4" stroke={warm} />
        </>
      ) : name === "habits" ? (
        <>
          <path d="M24 6 29 18l13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1Z" fill={warm} />
          <path {...line} d="m17 25 5 5 10-13" stroke={green} />
        </>
      ) : name === "notifications" ? (
        <>
          <path d="M15 20a9 9 0 0 1 18 0v9l5 6H10l5-6Z" fill={soft} />
          <path {...line} d="M15 20a9 9 0 0 1 18 0v9l5 6H10l5-6ZM20 39a5 5 0 0 0 8 0" stroke={warm} />
          <circle cx="34" cy="12" r="5" fill={cool} />
        </>
      ) : name === "user-plus" ? (
        <>
          <circle {...line} cx="19" cy="17" r="7" />
          <path {...line} d="M7 40a12 12 0 0 1 24 0M36 15v12M30 21h12" />
        </>
      ) : name === "mail" ? (
        <>
          <rect {...line} x="7" y="12" width="34" height="26" rx="5" />
          <path {...line} d="m9 15 15 12 15-12" />
        </>
      ) : name === "lock" ? (
        <>
          <rect {...line} x="12" y="22" width="24" height="18" rx="5" />
          <path {...line} d="M17 22v-6a7 7 0 0 1 14 0v6" />
        </>
      ) : name === "eye" ? (
        <>
          <path {...line} d="M5 24s8-12 19-12 19 12 19 12-8 12-19 12S5 24 5 24Z" />
          <circle {...line} cx="24" cy="24" r="6" />
        </>
      ) : name === "eye-off" ? (
        <>
          <path {...line} d="M7 7l34 34M18 13a20 20 0 0 1 6-1c11 0 19 12 19 12a31 31 0 0 1-6 7M13 16C8 20 5 24 5 24s8 12 19 12c2 0 4-.4 6-1" />
        </>
      ) : name === "shield" ? (
        <>
          <path {...line} d="M24 6 10 12v10c0 10 6 16 14 20 8-4 14-10 14-20V12Z" />
          <circle cx="24" cy="24" r="3" fill={cool} />
        </>
      ) : name === "bolt" ? (
        <path d="M27 4 9 27h14l-3 17 19-26H25Z" fill={violet} />
      ) : name === "check" ? (
        <>
          <circle {...line} cx="24" cy="24" r="18" />
          <path {...line} d="m16 24 6 6 12-15" stroke={green} />
        </>
      ) : name === "edit" ? (
        <>
          <path d="M11 32.5 31.5 12a3 3 0 0 1 4.2 0l0.3.3a3 3 0 0 1 0 4.2L15.5 37H11z" fill={soft} />
          <path {...line} d="M31.5 12 36 16.5M11 32.5 15.5 37" stroke={cool} />
          <path {...line} d="M13 34.5 12 41h6.5" stroke={warm} />
        </>
      ) : name === "trash" ? (
        <>
          <path d="M14 16h20l-2 22a4 4 0 0 1-4 3H20a4 4 0 0 1-4-3l-2-22Z" fill={soft} />
          <path {...line} d="M19 16V11h10v5M9 16h30M20 22v12M28 22v12" stroke={warm} />
        </>
      ) : name === "ban" ? (
        <>
          <circle {...line} cx="24" cy="24" r="16" />
          <path {...line} d="M13 35 35 13" stroke={warm} />
          <circle cx="24" cy="24" r="8" fill={soft} />
        </>
      ) : name === "database" ? (
        <>
          <ellipse cx="24" cy="13" rx="14" ry="6" fill={soft} />
          <path {...line} d="M10 13v10c0 3.3 6.3 6 14 6s14-2.7 14-6V13" />
          <path {...line} d="M10 23v10c0 3.3 6.3 6 14 6s14-2.7 14-6V23" stroke={cool} />
        </>
      ) : name === "download" ? (
        <>
          <path d="M24 5v18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path {...line} d="m16 20 8 8 8-8" stroke={warm} />
          <path {...line} d="M10 39h28" />
          <rect x="11" y="28" width="26" height="7" rx="3.5" fill={soft} />
        </>
      ) : name === "key" ? (
        <>
          <circle {...line} cx="17" cy="29" r="8" />
          <path {...line} d="m23 23 16-16M31 15l5 5M35 11l4 4" />
        </>
      ) : name === "palette" ? (
        <>
          <path d="M24 6c9 0 18 7 18 16s-7 14-14 14h-3c-4 0-5 2-5 4 0 1.5-1 2-2 2-4 0-9-3-9-10C9 16 14 6 24 6Z" fill={soft} />
          <circle cx="16" cy="18" r="2.8" fill={cool} />
          <circle cx="22" cy="13" r="2.8" fill={warm} />
          <circle cx="30" cy="14" r="2.8" fill={green} />
          <circle cx="34" cy="21" r="2.8" fill={violet} />
          <circle cx="18" cy="26" r="2.8" fill={warm} />
        </>
      ) : (
        <>
          <circle {...line} cx="24" cy="17" r="8" />
          <path {...line} d="M10 42a14 14 0 0 1 28 0" />
        </>
      )}
    </svg>
  );
}
