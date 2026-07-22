// Benja, el guía del juego: personaje vectorial basado en su character sheet
// (buzo verde con cordones, bermuda azul, zapatillas de colores, pelo corto
// castaño). Tres expresiones: feliz, piola (canchero) y sorpresa.
// `cuerpo` muestra el cuerpo entero; sin él, solo busto.

export type ExpresionBenja = 'feliz' | 'piola' | 'sorpresa';

const PIEL = '#f2c096';
const PIEL_SOMBRA = '#e0a878';
const PELO = '#7d5c3c';
const OJO = '#4a2f1d';
const BOCA = '#5b3626';
const BUZO = '#5da045';
const BUZO_OSCURO = '#4a8437';
const SHORT = '#2e3f68';

function Cara({ expresion }: { expresion: ExpresionBenja }) {
  const ojosGrandes = expresion === 'sorpresa';
  return (
    <g>
      {/* orejas */}
      <circle cx="44" cy="90" r="10" fill={PIEL} stroke={PIEL_SOMBRA} strokeWidth="2" />
      <circle cx="156" cy="90" r="10" fill={PIEL} stroke={PIEL_SOMBRA} strokeWidth="2" />
      {/* pelo (casquete) y cara */}
      <ellipse cx="100" cy="66" rx="55" ry="44" fill={PELO} />
      <ellipse cx="100" cy="92" rx="51" ry="46" fill={PIEL} />
      <path d="M52 74 Q74 56 100 58 Q126 56 148 74 Q140 52 100 48 Q60 52 52 74 Z" fill={PELO} />
      {/* cejas */}
      <path
        d="M64 72 Q78 66 90 71"
        stroke={PELO}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M110 71 Q122 66 136 72"
        stroke={PELO}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* ojos */}
      <ellipse cx="79" cy="88" rx="11" ry={ojosGrandes ? 15 : 13} fill="#fff" />
      <ellipse cx="121" cy="88" rx="11" ry={ojosGrandes ? 15 : 13} fill="#fff" />
      <circle cx="80" cy="90" r={ojosGrandes ? 8 : 7} fill={OJO} />
      <circle cx="120" cy="90" r={ojosGrandes ? 8 : 7} fill={OJO} />
      <circle cx="83" cy="87" r="2.4" fill="#fff" />
      <circle cx="123" cy="87" r="2.4" fill="#fff" />
      {/* nariz */}
      <path d="M97 100 Q100 105 103 100" stroke={PIEL_SOMBRA} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* boca según expresión */}
      {expresion === 'feliz' && (
        <g>
          <path d="M78 108 Q100 132 122 108 Q100 118 78 108 Z" fill={BOCA} />
          <path d="M88 116 Q100 124 112 116 Q100 121 88 116 Z" fill="#e5766b" />
        </g>
      )}
      {expresion === 'piola' && (
        <path
          d="M84 113 Q102 122 118 109"
          stroke={BOCA}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {expresion === 'sorpresa' && <ellipse cx="100" cy="116" rx="9" ry="12" fill={BOCA} />}
      {/* cachetes */}
      <ellipse cx="66" cy="104" rx="8" ry="5" fill="#f0a987" opacity="0.55" />
      <ellipse cx="134" cy="104" rx="8" ry="5" fill="#f0a987" opacity="0.55" />
    </g>
  );
}

type Props = {
  expresion?: ExpresionBenja;
  cuerpo?: boolean;
  ancho?: number;
};

export default function Benja({ expresion = 'feliz', cuerpo = false, ancho = 96 }: Props) {
  const alto = cuerpo ? Math.round((ancho * 300) / 200) : Math.round((ancho * 150) / 150);
  return (
    <svg
      viewBox={cuerpo ? '20 14 160 286' : '30 24 140 140'}
      width={ancho}
      height={alto}
      role="img"
      aria-label="Benja"
    >
      {/* cuerpo detrás de la cabeza */}
      <g>
        {/* capucha */}
        <ellipse cx="100" cy="140" rx="40" ry="14" fill={BUZO_OSCURO} />
        {/* brazos */}
        <rect x="36" y="142" width="26" height="60" rx="13" fill={BUZO} />
        <rect x="138" y="142" width="26" height="60" rx="13" fill={BUZO} />
        {/* torso */}
        <rect x="56" y="134" width="88" height="76" rx="24" fill={BUZO} />
        {/* cordones */}
        <path d="M92 146 L90 160" stroke="#f4eede" strokeWidth="4" strokeLinecap="round" />
        <path d="M108 146 L110 160" stroke="#f4eede" strokeWidth="4" strokeLinecap="round" />
        <circle cx="90" cy="162" r="3" fill="#f4eede" />
        <circle cx="110" cy="162" r="3" fill="#f4eede" />
        {/* bolsillo canguro */}
        <path
          d="M74 176 L126 176 L120 200 L80 200 Z"
          fill={BUZO_OSCURO}
          stroke={BUZO_OSCURO}
          strokeWidth="2"
        />
        {/* manos */}
        <circle cx="49" cy="206" r="10" fill={PIEL} />
        <circle cx="151" cy="206" r="10" fill={PIEL} />
        {cuerpo && (
          <g>
            {/* bermuda */}
            <rect x="62" y="206" width="76" height="36" rx="10" fill={SHORT} />
            <rect x="60" y="216" width="12" height="16" rx="4" fill={SHORT} />
            <rect x="128" y="216" width="12" height="16" rx="4" fill={SHORT} />
            <path d="M100 210 L100 240" stroke="#24314f" strokeWidth="3" />
            {/* piernas y medias */}
            <rect x="72" y="240" width="18" height="24" rx="9" fill={PIEL} />
            <rect x="110" y="240" width="18" height="24" rx="9" fill={PIEL} />
            <rect x="71" y="258" width="20" height="10" rx="5" fill="#fff" />
            <rect x="109" y="258" width="20" height="10" rx="5" fill="#fff" />
            {/* zapatillas de colores */}
            <g>
              <rect x="62" y="266" width="34" height="18" rx="9" fill="#3f6fd8" />
              <circle cx="70" cy="276" r="7" fill="#e8722c" />
              <rect x="62" y="279" width="34" height="6" rx="3" fill="#f4eede" />
              <path d="M78 270 L90 270" stroke="#f4eede" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g>
              <rect x="104" y="266" width="34" height="18" rx="9" fill="#7cc242" />
              <circle cx="130" cy="276" r="7" fill="#3f6fd8" />
              <rect x="104" y="279" width="34" height="6" rx="3" fill="#f4eede" />
              <path d="M110 270 L122 270" stroke="#f4eede" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>
        )}
      </g>
      <Cara expresion={expresion} />
    </svg>
  );
}
