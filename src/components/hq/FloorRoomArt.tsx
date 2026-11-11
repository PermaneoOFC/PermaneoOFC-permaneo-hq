const accents: Record<string, string> = {
  engenharia: "#69c7b4",
  estudio: "#c5a185",
  biblioteca: "#9caf8f",
  coordenacao: "#7cafc4",
  negocios: "#c4b17e",
};
export function FloorRoomArt({ room }: { room: string }) {
  const accent = accents[room];
  return (
    <g aria-hidden="true">
      <path d="M0 0H960V460H0Z" fill="#1d3038" />
      <path d="M45 26H915V235H45Z" fill="#2c444b" />
      <path d="M45 235H915L960 460H0Z" fill="#344449" />
      <path d="M0 0 45 26V235L0 460M960 0 915 26V235L960 460" fill="#14272f" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={i}
          d={`M${45 + i * 125} 235 ${i * 145 - 30} 460`}
          stroke="#778b84"
          opacity=".1"
        />
      ))}
      <path d="M45 234H915" stroke={accent} strokeWidth="3" />
      <path d="M170 0v42m610-42v42" stroke="#0f222a" strokeWidth="3" />
      <path d="M120 43h100m510 0h100" stroke="#c0d8ce" strokeWidth="5" />
      <path d="M120 48 80 235H260L220 48M730 48 680 235H870L830 48" fill={accent} opacity=".04" />
      {room === "engenharia" && (
        <>
          <rect x="70" y="60" width="120" height="170" rx="5" fill="#11252d" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect x="80" y={72 + i * 25} width="100" height="17" rx="2" fill="#3a5158" />
              <circle cx="165" cy={80 + i * 25} r="3" fill={accent} />
            </g>
          ))}
          <rect x="240" y="68" width="400" height="135" rx="4" fill="#132a32" />
          <path
            d="M270 100h90m-90 25h280m-280 25h200m-200 25h250"
            stroke={accent}
            strokeWidth="5"
          />
          {[0, 1, 2, 3].map((i) => (
            <Desk key={i} x={215 + i * 165} y={245 + (i % 2) * 30} accent={accent!} />
          ))}
        </>
      )}
      {room === "estudio" && (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={90 + i * 125}
                y="70"
                width="105"
                height="135"
                fill={["#c9a27d", "#739f9c", "#b2a7ba"][i]}
              />
              <text x={110 + i * 125} y="155" fontFamily="serif" fontSize="55" fill="#263b42">
                {["Aa", "P.", "01"][i]}
              </text>
            </g>
          ))}
          <path d="M500 80h330m-330 90h330" stroke="#ac8a68" strokeWidth="7" />
          <path d="M520 155v-50m22 50v-40m22 40v-55m22 55v-44" stroke="#c3b59b" strokeWidth="12" />
          <path d="M200 250H720L800 335H130Z" fill="#a18468" />
          <path d="M130 335h670v12H130Z" fill="#725b48" />
          <path d="M170 347v50m590-50v50" stroke="#172930" strokeWidth="12" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={255 + i * 155}
                y={271 + i * 6}
                width="100"
                height="42"
                rx="2"
                fill={["#d6cdb5", "#81aaa7", "#b9a3b1"][i]}
              />
              <path
                d={`M${266 + i * 155} ${282 + i * 6}h70m-70 10h45`}
                stroke="#4a6566"
                strokeWidth="3"
              />
            </g>
          ))}
        </>
      )}
      {room === "biblioteca" && (
        <>
          {[0, 1, 2].map((j) => (
            <g key={j}>
              <path d={`M80 ${100 + j * 55}h410`} stroke="#a08468" strokeWidth="7" />
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <rect
                  key={i}
                  x={90 + i * 35}
                  y={62 + j * 55 + (i % 3) * 4}
                  width="23"
                  height={35 - (i % 3) * 4}
                  fill={["#a39b7d", "#6f9290", "#b9ad92"][i % 3]}
                />
              ))}
            </g>
          ))}
          <rect
            x="590"
            y="70"
            width="210"
            height="140"
            fill="#142b32"
            stroke="#657c79"
            strokeWidth="4"
          />
          <path
            d="M610 95h140m-140 20h164m-164 20h120m-120 20h155"
            stroke="#b2c2ad"
            strokeWidth="5"
          />
          <path d="M180 270H720L770 340H135Z" fill="#9a846a" />
          <path d="M175 340v65m550-65v65" stroke="#1a2d33" strokeWidth="10" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={`M${230 + i * 155} 290q30-10 60 0v37q-30-10-60 0Z`} fill="#ddd5ba" />
              <path d={`M${260 + i * 155} 290v34`} stroke="#8b9785" />
            </g>
          ))}
        </>
      )}
      {room === "coordenacao" && (
        <>
          <rect x="105" y="65" width="500" height="153" rx="4" fill="#c7cebd" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path d={`M${130 + i * 115} 90h90`} stroke="#526d6a" strokeWidth="5" />
              {[0, 1, 2].map((j) => (
                <rect
                  key={j}
                  x={130 + i * 115}
                  y={108 + j * 30}
                  width="75"
                  height="22"
                  rx="2"
                  fill={["#819d91", "#aa9674", "#7897a6"][j]}
                />
              ))}
            </g>
          ))}
          <ellipse cx="470" cy="306" rx="260" ry="70" fill="#81938d" />
          <ellipse cx="470" cy="299" rx="260" ry="64" fill="#b29b7b" />
          <path d="M320 330v65m300-65v65" stroke="#1b3035" strokeWidth="12" />
          <rect x="420" y="275" width="95" height="42" rx="4" fill="#243c43" />
          <path d="M436 285h60m-60 10h40" stroke={accent} strokeWidth="3" />
        </>
      )}
      {room === "negocios" && (
        <>
          <rect
            x="130"
            y="60"
            width="520"
            height="150"
            fill="#162c33"
            stroke="#536d72"
            strokeWidth="4"
          />
          <path
            d="M160 180 220 146 290 162 370 105 450 127 590 80"
            fill="none"
            stroke={accent}
            strokeWidth="6"
          />
          <path d="M160 193h440" stroke="#74877c" />
          <Desk x={240} y={280} accent={accent!} />
          <Desk x={580} y={280} accent={accent!} />
          <path d="M410 295h110v85H410Z" fill="#526d70" />
          <path d="M420 310h90m-90 25h90" stroke="#839b94" strokeWidth="4" />
        </>
      )}
      <path
        d="M850 270v-90m0 65q-60-20-40-55 36 5 40 55m0-20q40-55 55-20-6 30-55 20"
        fill="#527f6b"
        stroke="#83a58a"
        strokeWidth="3"
      />
      <path d="M825 260h50l-8 45h-34Z" fill="#b29879" />
    </g>
  );
}
function Desk({ x, y, accent }: { x: number; y: number; accent: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-50 0H70L90 38H-70Z" fill="#9c846b" />
      <path d="M-60 38v45m140-45v45" stroke="#172d34" strokeWidth="8" />
      <rect
        x="-36"
        y="-50"
        width="90"
        height="55"
        rx="4"
        fill="#10252e"
        stroke="#708b8d"
        strokeWidth="3"
      />
      <path d="M-24-37h52m-52 10h64m-64 10h36" stroke={accent} strokeWidth="3" />
      <path d="M10 5v12" stroke="#839997" strokeWidth="4" />
      <rect x="-35" y="23" width="70" height="8" rx="2" fill="#334b50" />
    </g>
  );
}
