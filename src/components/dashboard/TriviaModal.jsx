export default function TriviaModal({ preguntaSiguiente, triviaActual, PREGUNTAS_TRIVIA, triviaSeleccion, triviaResultado, onResponder, onReclamarTrivia, onCerrar }) {
  if (!preguntaSiguiente) return null;

  if (triviaResultado) {
    const emoji = triviaResultado.correctas === PREGUNTAS_TRIVIA.length ? "🏆" : triviaResultado.correctas >= 4 ? "🎉" : triviaResultado.correctas >= 2 ? "⭐" : "💪";
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}>
        <div style={{ background: "linear-gradient(135deg, var(--card) 0%, rgba(var(--card-rgb, 26, 17, 48), 0.95) 100%)", borderRadius: 20, padding: 28, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: "bounce 0.6s" }}>{emoji}</div>
          <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>
            {triviaResultado.correctas === PREGUNTAS_TRIVIA.length ? "¡Perfecto!" : triviaResultado.correctas >= 4 ? "¡Muy bien!" : triviaResultado.correctas >= 2 ? "Buen intento" : "Continúa intentando"}
          </div>
          <div style={{ color: "var(--texto-sec)", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            Acertaste <span style={{ color: "#16C784", fontWeight: 800 }}>{triviaResultado.correctas}</span> de <span style={{ color: "var(--texto)", fontWeight: 700 }}>{triviaResultado.total}</span> preguntas
          </div>
          
          <div style={{ display: "flex", gap: 6, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {Array.from({ length: triviaResultado.total }).map((_, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: i < triviaResultado.correctas ? "linear-gradient(135deg, rgba(22,199,132,0.25) 0%, rgba(22,199,132,0.1) 100%)" : "linear-gradient(135deg, rgba(237,30,40,0.15) 0%, rgba(237,30,40,0.05) 100%)", border: i < triviaResultado.correctas ? "1.5px solid rgba(22,199,132,0.4)" : "1.5px solid rgba(237,30,40,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: i < triviaResultado.correctas ? "#16C784" : "#ED1E28" }}>
                {i < triviaResultado.correctas ? "✓" : "✕"}
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(236,168,45,0.15) 0%, rgba(236,168,45,0.05) 100%)", border: "1.5px solid rgba(236,168,45,0.3)", borderRadius: 14, padding: 16, marginBottom: 18 }}>
            <div style={{ color: "var(--texto-sec)", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>MONEDAS GANADAS</div>
            <div style={{ color: "#ECA82D", fontWeight: 900, fontSize: 32 }}>+{triviaResultado.monedas} 🪙</div>
          </div>

          <button
            onClick={onReclamarTrivia}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #ECA82D, #c9891a)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(236,168,45,0.3)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 24px rgba(236,168,45,0.4)" }}
            onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 6px 20px rgba(236,168,45,0.3)" }}
          >
            ✓ Reclamar +{triviaResultado.monedas} 🪙
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "linear-gradient(135deg, var(--card) 0%, rgba(var(--card-rgb, 26, 17, 48), 0.95) 100%)", borderRadius: 20, padding: 24, maxWidth: 500, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 18 }}>🧠 Trivia del Mundial</div>
            <div style={{ color: "var(--texto-sec)", fontSize: 12, marginTop: 2 }}>Pregunta {triviaActual + 1} de {PREGUNTAS_TRIVIA.length}</div>
          </div>
          <button onClick={onCerrar} style={{ background: "rgba(255,255,255,0.1)", border: "none", fontSize: 20, cursor: "pointer", color: "var(--texto-ter)", width: 32, height: 32, borderRadius: 8, transition: "all 0.2s" }} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.15)" }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.1)" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {PREGUNTAS_TRIVIA.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < triviaActual ? "rgba(22,199,132,0.5)" : i === triviaActual ? "rgba(253,119,81,0.5)" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(130,43,210,0.15) 0%, rgba(253,119,81,0.1) 100%)", border: "1.5px solid rgba(130,43,210,0.3)", borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ color: "var(--texto)", fontWeight: 700, fontSize: 16, lineHeight: 1.5 }}>{preguntaSiguiente.pregunta}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {preguntaSiguiente.opciones.map((opcion, idx) => {
            const isSelected = triviaSeleccion === idx;
            const isCorrect = idx === preguntaSiguiente.correcta;
            const answered = triviaSeleccion !== null;
            
            let bgStyle = "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)";
            let borderStyle = "1.5px solid rgba(255,255,255,0.15)";
            let textColor = "#FFFFFF";
            
            if (answered) {
              if (isSelected && isCorrect) {
                bgStyle = "linear-gradient(135deg, rgba(22,199,132,0.25) 0%, rgba(22,199,132,0.1) 100%)";
                borderStyle = "1.5px solid rgba(22,199,132,0.4)";
                textColor = "#16C784";
              } else if (isSelected && !isCorrect) {
                bgStyle = "linear-gradient(135deg, rgba(237,30,40,0.25) 0%, rgba(237,30,40,0.1) 100%)";
                borderStyle = "1.5px solid rgba(237,30,40,0.4)";
                textColor = "#ED1E28";
              } else if (!isSelected && isCorrect) {
                bgStyle = "linear-gradient(135deg, rgba(22,199,132,0.15) 0%, rgba(22,199,132,0.05) 100%)";
                borderStyle = "1.5px solid rgba(22,199,132,0.3)";
                textColor = "#16C784";
              }
            }
            
            return (
              <button
                key={idx}
                onClick={() => !answered && onResponder(idx)}
                disabled={answered}
                style={{
                  padding: "14px 16px",
                  background: bgStyle,
                  border: borderStyle,
                  borderRadius: 12,
                  color: textColor,
                  cursor: answered ? "default" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  if (!answered) {
                    e.target.style.background = "linear-gradient(135deg, rgba(253,119,81,0.15) 0%, rgba(253,119,81,0.05) 100%)";
                    e.target.style.borderColor = "rgba(253,119,81,0.4)";
                    e.target.style.transform = "translateX(4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answered) {
                    e.target.style.background = "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)";
                    e.target.style.borderColor = "rgba(255,255,255,0.15)";
                    e.target.style.transform = "translateX(0)";
                  }
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1 }}>{opcion}</span>
                {answered && isSelected && (isCorrect ? "✓" : "✕")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
