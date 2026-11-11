import { identity } from "./identities";

export function Portrait({ slug, name }: { slug: string; name: string }) {
  const p = identity(slug);
  const glasses = ["backend", "documentarista", "financeiro", "pesquisa-dados"].includes(slug);
  return (
    <svg
      role="img"
      aria-label={`${name} — avatar`}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="110" rx="18" fill={p.accent} />
      <path d="M0 80 100 22V110H0Z" fill="#14252b" opacity=".18" />
      <path d={p.cut} fill={p.hair} />
      <path d="M38 59H60V81H38Z" fill={p.skin} />
      <path d="M38 61 60 59V70L38 75Z" fill="#50392d" opacity=".2" />
      <path d="M9 110 14 86Q18 78 37 75L49 82 62 75Q82 77 87 89L94 110Z" fill={p.jacket} />
      <path d="M37 75 49 82 62 75 58 110H41Z" fill="#e1e2d7" />
      <path
        d="M36 75 28 86 38 94 32 110M63 75 72 86 63 95 69 110"
        fill="none"
        stroke="#172932"
        strokeOpacity=".35"
        strokeWidth="2"
      />
      <path d="M29 36Q29 22 48 23Q69 22 69 38L66 57Q62 69 49 70Q36 68 31 56Z" fill={p.skin} />
      <path d={p.cut} fill={p.hair} />
      <path d="M36 43 43 42M55 42 62 43" stroke={p.hair} strokeWidth="2" strokeLinecap="round" />
      <path d="M40 47v1M58 47v1" stroke="#222c30" strokeWidth="2.7" strokeLinecap="round" />
      <path
        d="M49 47 47 55h4M43 61q6 3 12-1"
        fill="none"
        stroke="#744b3b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {glasses && (
        <g fill="none" stroke="#203039" strokeWidth="2">
          <rect x="32" y="40" width="15" height="12" rx="4" />
          <rect x="52" y="40" width="15" height="12" rx="4" />
          <path d="M47 45h5" />
        </g>
      )}
      {["frontend", "trello-scrum", "devops"].includes(slug) && (
        <g fill="none" stroke="#20313c" strokeWidth="4">
          <path d="M25 46V34a24 24 0 0 1 48 0v15" />
          <path d="M72 46v11l-12 3" />
          <path d="M24 40v12M73 40v12" stroke={p.accent} strokeWidth="6" />
        </g>
      )}
      {["backend", "negocios", "pitch"].includes(slug) && (
        <path d="M33 55 41 63H57L65 54 62 65 50 72 38 66Z" fill={p.hair} opacity=".8" />
      )}
      {["ui-ux", "marketing", "educacional"].includes(slug) && (
        <path d="M29 52v6m41-6v6" stroke="#ecd4a1" strokeWidth="3" />
      )}
      <rect x="65" y="87" width="22" height="17" rx="3" fill="#20313c" />
      <text x="76" y="99" textAnchor="middle" fill={p.accent} fontFamily="monospace" fontSize="10">
        {
          {
            plan: "PM",
            kanban: "≡",
            interface: "UI",
            code: "{}",
            server: "↑",
            shield: "✓",
            design: "Aa",
            brand: "M",
            slides: "▶",
            archive: "¶",
            data: "∑",
            learning: "Ed",
            strategy: "↗",
            finance: "$",
          }[p.item]
        }
      </text>
    </svg>
  );
}
