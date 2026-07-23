// Festejo al resolver: la cosecha vuela hacia la mascota y llueve un confetti
// mínimo (GAMEFEEL.md 6). Determinista: sin azar, posiciones por índice.

const COLORES = ['#7bc86c', '#ffd166', '#f5a95d', '#7ab8f5', '#e58fb1'];

export default function Celebracion({ emoji }: { emoji: string }) {
  return (
    <div className="celebracion" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={`b${i}`} className="cosecha__brote" style={{ animationDelay: `${i * 0.09}s` }}>
          {emoji}
        </span>
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="confeti"
          style={{
            left: `${(i * 31 + 7) % 100}%`,
            background: COLORES[i % COLORES.length],
            animationDelay: `${(i % 7) * 0.09}s`,
          }}
        />
      ))}
    </div>
  );
}
