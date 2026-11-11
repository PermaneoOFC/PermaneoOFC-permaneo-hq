import { identity } from "./identities";

/** Architectural illustration shared by the floor and personal studios. */
export function WorkspaceArt({ slug }: { slug: string }) {
  const p = identity(slug);
  return (
    <g aria-hidden="true">
      <path d="M0 0H960V460H0Z" fill="#17282f" />
      <path d="M0 0H960V305H0Z" fill="#233941" />
      <path d="M0 0 95 42V305L0 460Z" fill="#1c3038" />
      <path d="M960 0 864 42V305L960 460Z" fill="#30464c" />
      <path d="M95 305H864L960 460H0Z" fill="#304044" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={i}
          d={`M${95 + i * 110} 305 ${i * 140 - 20} 460`}
          stroke="#597073"
          strokeOpacity=".18"
        />
      ))}
      <path d="M95 303H864" stroke={p.accent} strokeWidth="3" opacity=".65" />
      <path d="M195 0v47m550-47v47" stroke="#101e25" strokeWidth="3" />
      <path d="M155 48h80m470 0h80" stroke="#ccd9cf" strokeWidth="5" />
      <path
        d="M155 52 100 290H290L235 52M705 52 650 290H840L785 52"
        fill={p.accent}
        opacity=".04"
      />
      <rect
        x="112"
        y="72"
        width="176"
        height="148"
        rx="4"
        fill="#0e252e"
        stroke="#547278"
        strokeWidth="5"
      />
      <path d="M119 205 156 160 187 190 239 122 281 177V213H119Z" fill="#33555c" />
      <path d="M200 75v143m-85-69h170" stroke="#789092" strokeWidth="4" />
      <path d="M127 87h57" stroke="#bad7ce" opacity=".4" strokeWidth="3" />
      <rect
        x="331"
        y="76"
        width="300"
        height="145"
        rx="4"
        fill="#15272e"
        stroke="#52666b"
        strokeWidth="4"
      />
      <WorkBoard kind={p.item} accent={p.accent} />
      <text x="347" y="96" fill="#adbfbc" fontFamily="monospace" fontSize="9" letterSpacing="1">
        {p.label.toUpperCase()}
      </text>
      <path d="M704 110h133m-133 71h133m-133 71h133" stroke="#a08365" strokeWidth="7" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect
            x={710 + i * 18}
            y={126 + (i % 3) * 6}
            width="12"
            height={52 - (i % 3) * 6}
            rx="1"
            fill={["#a28669", p.accent, "#526b71"][i % 3]}
          />
          <path d={`M${713 + i * 18} 157h6`} stroke="#d8d2b8" />
        </g>
      ))}
      <rect x="711" y="213" width="54" height="35" rx="3" fill="#485c61" />
      <path d="M722 223h32m-32 9h32" stroke="#90a29c" strokeWidth="2" />
      <path
        d="M789 100v-30m0 17q-28-15-13-28 18 4 13 28m0-4q23-25 30-8-7 16-30 8"
        fill="#5e8c73"
        stroke="#5e8c73"
        strokeWidth="3"
      />
      <path d="M775 94h29l-4 14h-21Z" fill="#b39370" />
      <ellipse cx="161" cy="378" rx="38" ry="10" fill="#102229" opacity=".6" />
      <path d="M139 331h43l-8 48h-27Z" fill="#a18b71" />
      <path
        d="M160 341v-87m0 50q-53-15-39-48 34 3 39 48m0-19q39-49 53-15-8 31-53 15m0-9q-30-37-9-48 25 17 9 48"
        fill="#467c67"
        stroke="#73a58a"
        strokeWidth="2"
      />
      <path d="M776 300h55v83h-55Z" fill="#14272d" />
      <path d="M786 314h35m-35 17h35m-35 17h35" stroke="#6d8583" strokeWidth="5" />
      <circle cx="817" cy="367" r="3" fill={p.accent} />
      <path
        d="M378 263q0-35 40-35h83q40 0 40 35v87H378Z"
        fill="#111f26"
        stroke="#53666b"
        strokeWidth="4"
      />
      <path d="M229 332H711L743 352H199Z" fill="#aa8464" />
      <path d="M199 352H743V362H199Z" fill="#6b5140" />
      <path d="M222 362v63m495-63v63" stroke="#1a252c" strokeWidth="12" />
      <rect
        x="241"
        y="243"
        width="137"
        height="80"
        rx="5"
        fill="#101f26"
        stroke="#668387"
        strokeWidth="4"
      />
      <path d="M309 324v12m-22 0h44" stroke="#7f9694" strokeWidth="5" />
      <path
        d="M253 260h42m-42 11h92m-92 11h62m-62 11h78"
        stroke={p.accent}
        strokeWidth="3"
        opacity=".8"
      />
      {["interface", "code", "server", "shield"].includes(p.item) && (
        <g>
          <rect
            x="554"
            y="243"
            width="127"
            height="80"
            rx="4"
            fill="#101f26"
            stroke="#668387"
            strokeWidth="4"
          />
          <path d="M615 324v12" stroke="#819794" strokeWidth="5" />
          <path d="M568 261h94m-94 15h62m-62 15h82" stroke={p.accent} strokeWidth="3" />
        </g>
      )}
      {["design", "brand", "slides"].includes(p.item) && (
        <g>
          <path d="M573 329 603 268H663L645 329Z" fill="#17262d" stroke="#849797" strokeWidth="3" />
          <path d="M594 314 613 281H647L634 314Z" fill={p.accent} />
          <path d="M670 329 687 285" stroke="#dbc09a" strokeWidth="4" />
        </g>
      )}
      {["archive", "learning", "data", "finance", "strategy", "plan", "kanban"].includes(
        p.item,
      ) && (
        <g>
          <path d="M563 315h100v12H563Z" fill={p.accent} />
          <path d="M576 301h92v12h-92Z" fill="#b49b79" />
          <path d="M582 304h80" stroke="#ece1c4" strokeWidth="4" />
          <path d="M675 318v-42l22 4v38" fill="#c3b695" />
        </g>
      )}
      <rect x="270" y="340" width="95" height="9" rx="3" fill="#273d44" />
      <path d="M280 344h75" stroke="#91a6a6" strokeDasharray="3 3" />
      <rect x="555" y="332" width="50" height="15" rx="2" fill="#e3d9ba" />
      <path d="M562 336h35m-35 5h24" stroke="#79948a" />
      <path d="M646 320h17v24h-17z" fill={p.accent} />
      <path d="M663 323q15 0 9 13h-9" fill="none" stroke={p.accent} strokeWidth="3" />
      <g transform="translate(709 58) scale(.75)">
        {p.item === "plan" && (
          <>
            <rect width="93" height="61" rx="3" fill="#c9c9b1" />
            <path
              d="M10 15h70m-70 12h70m-70 12h70m-50-32v46m23-46v46"
              stroke="#567f7a"
              strokeWidth="2"
            />
          </>
        )}
        {p.item === "kanban" && (
          <>
            <rect width="93" height="61" rx="3" fill="#17323b" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path d={`M${10 + i * 28} 10v43`} stroke="#8da39e" />
                {[0, 1].map((j) => (
                  <rect
                    key={j}
                    x={14 + i * 28}
                    y={14 + j * 20}
                    width="19"
                    height="13"
                    fill={p.accent}
                  />
                ))}
              </g>
            ))}
          </>
        )}
        {p.item === "interface" && (
          <>
            <rect
              x="25"
              width="31"
              height="62"
              rx="5"
              fill="#122730"
              stroke="#86aba7"
              strokeWidth="2"
            />
            <rect x="30" y="10" width="21" height="17" fill={p.accent} />
            <path d="M30 34h21m-21 8h15" stroke="#a3bbb4" strokeWidth="2" />
          </>
        )}
        {p.item === "code" && (
          <g fill="#1b333c" stroke={p.accent} strokeWidth="2">
            <ellipse cx="45" cy="12" rx="32" ry="10" />
            <path d="M13 12v38q32 20 64 0V12M13 30q32 20 64 0" />
          </g>
        )}
        {p.item === "server" && (
          <g fill="#122730" stroke="#69867f" strokeWidth="2">
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect y={i * 22} width="91" height="18" rx="3" />
                <circle cx="76" cy={i * 22 + 9} r="3" fill={p.accent} />
              </g>
            ))}
          </g>
        )}
        {p.item === "shield" && (
          <path
            d="M45 0 80 12v23q0 20-35 34Q10 55 10 35V12ZM28 30l12 12 23-27"
            fill="#18313a"
            stroke={p.accent}
            strokeWidth="3"
          />
        )}
        {p.item === "design" && (
          <>
            <path d="M20 60 49 0l30 60Z" fill="#d1b78b" />
            <path d="M37 44 49 20l12 24Z" fill="#283b41" />
            <path d="M5 60 20 5" stroke={p.accent} strokeWidth="5" />
          </>
        )}
        {p.item === "brand" && (
          <>
            <rect y="17" width="86" height="45" rx="5" fill="#172c35" />
            <circle cx="46" cy="39" r="17" fill="#43626a" stroke={p.accent} strokeWidth="4" />
            <rect x="12" y="9" width="23" height="9" fill="#839c98" />
          </>
        )}
        {p.item === "slides" && (
          <>
            <rect
              x="30"
              width="25"
              height="42"
              rx="12"
              fill="#142831"
              stroke={p.accent}
              strokeWidth="3"
            />
            <path
              d="M20 25v10q0 22 22 22t23-22V25M42 57v10m-17 0h34"
              fill="none"
              stroke="#8b9e95"
              strokeWidth="3"
            />
          </>
        )}
        {p.item === "archive" && (
          <>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={i * 29} width="24" height="62" fill={i === 1 ? p.accent : "#a18b6b"} />
                <rect x={i * 29 + 5} y="10" width="14" height="21" fill="#d5cbb0" />
              </g>
            ))}
          </>
        )}
        {p.item === "data" && (
          <>
            <circle cx="35" cy="26" r="23" fill="#28444c" stroke={p.accent} strokeWidth="4" />
            <path d="M52 43 78 67" stroke="#ab9579" strokeWidth="9" />
            <path d="M22 37V23m12 14V12m12 25V18" stroke="#c6c5aa" strokeWidth="4" />
          </>
        )}
        {p.item === "learning" && (
          <>
            <path d="M0 15q23-15 46 0 23-15 46 0v47q-23-15-46 0-23-15-46 0Z" fill="#d2c7a5" />
            <path d="M46 15v47" stroke="#7b8d80" />
            <text x="8" y="43" fontSize="19" fill="#365b59">
              ABC
            </text>
          </>
        )}
        {p.item === "strategy" && (
          <>
            <circle cx="46" cy="29" r="28" fill="none" stroke={p.accent} strokeWidth="3" />
            <path
              d="M46 1v56M18 29h56M46 1q-27 28 0 56 27-28 0-56M46 57v12m-20 0h40"
              fill="none"
              stroke="#9fb3a9"
              strokeWidth="2"
            />
          </>
        )}
        {p.item === "finance" && (
          <>
            <rect x="20" width="53" height="67" rx="4" fill="#182e38" />
            <rect x="27" y="8" width="39" height="14" fill={p.accent} />
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M29 ${32 + i * 12}h5m8 0h5m8 0h5`}
                stroke="#d2c6a5"
                strokeWidth="6"
              />
            ))}
          </>
        )}
      </g>
    </g>
  );
}

function WorkBoard({ kind, accent }: { kind: string; accent: string }) {
  if (["design", "brand", "slides"].includes(kind))
    return (
      <g>
        <rect x="348" y="112" width="80" height="88" fill={accent} />
        <text x="359" y="169" fontSize="37" fill="#233039" fontFamily="serif">
          {kind === "brand" ? "P." : kind === "slides" ? "01" : "Aa"}
        </text>
        <rect x="440" y="112" width="171" height="48" rx="3" fill="#3c535b" />
        <path d="M452 126h94m-94 12h135" stroke="#bdc7bd" strokeWidth="3" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={440 + i * 44}
            y="173"
            width="36"
            height="27"
            rx="2"
            fill={[accent, "#a99374", "#738c80", "#c7c9b2"][i]}
          />
        ))}
      </g>
    );
  if (["data", "finance", "strategy"].includes(kind))
    return (
      <g>
        <path d="M350 112v89h260" fill="none" stroke="#607777" />
        {[32, 51, 38, 72, 57, 82].map((h, i) => (
          <rect
            key={i}
            x={363 + i * 25}
            y={200 - h}
            width="14"
            height={h}
            fill={accent}
            opacity={0.4 + i * 0.1}
          />
        ))}
        <path
          d={
            kind === "strategy"
              ? "M368 159 402 173 440 143 475 150 510 116"
              : "M368 175 402 160 440 167 475 130 510 117"
          }
          fill="none"
          stroke="#e0cba5"
          strokeWidth="3"
        />
        <text x="538" y="145" fill={accent} fontSize="23">
          {kind === "finance" ? "R$" : kind === "data" ? "Σ" : "↗"}
        </text>
        <path d="M538 165h60m-60 12h40" stroke="#8ba19f" strokeWidth="3" />
      </g>
    );
  if (["code", "interface", "server", "shield"].includes(kind))
    return (
      <g>
        <rect x="349" y="111" width="72" height="92" fill="#29424b" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="358" y={120 + i * 20} width="53" height="12" rx="2" fill="#162b33" />
            <circle cx="402" cy={126 + i * 20} r="2" fill={accent} />
            <path
              d={`M438 ${123 + i * 23}h${[80, 152, 115, 138][i]}`}
              stroke={accent}
              strokeWidth="4"
            />
          </g>
        ))}
        <text x="576" y="145" fill="#d5d5bd" fontSize="24">
          {kind === "shield" ? "✓" : kind === "interface" ? "UI" : kind === "server" ? "↑" : "{}"}
        </text>
      </g>
    );
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M${350 + i * 88} 115h74`} stroke={accent} strokeWidth="4" />
          {[0, 1, 2].map((j) => (
            <g key={j}>
              <rect
                x={350 + i * 88}
                y={127 + j * 24}
                width="74"
                height="18"
                rx="2"
                fill={j === i ? accent : "#3b5056"}
              />
              <path
                d={`M${358 + i * 88} ${135 + j * 24}h${35 + i * 6}`}
                stroke="#bbc7ba"
                strokeWidth="2"
              />
            </g>
          ))}
        </g>
      ))}
      <text x="585" y="199" fontSize="12" fill={accent}>
        {kind === "learning" ? "ABC" : kind === "archive" ? "DOC" : ""}
      </text>
    </g>
  );
}
