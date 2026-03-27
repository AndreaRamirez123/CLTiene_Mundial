import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const temas = {
  oscuro: {
    id: "oscuro",
    bg: "#0f0a1e",
    bgGradient: "linear-gradient(180deg, #0f0a1e 0%, #1a1035 100%)",
    card: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.06)",
    texto: "#ffffff",
    textoSec: "rgba(255,255,255,0.7)",
    textoTer: "rgba(255,255,255,0.4)",
    navbar: "rgba(15,10,30,0.98)",
    navBorder: "rgba(253,119,81,0.2)",
    input: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(255,255,255,0.1)",
    inputTexto: "#fff",
    stickyHeader: "rgba(15,10,30,0.95)",
  },
  claro: {
    id: "claro",
    bg: "#f5f5f7",
    bgGradient: "linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)",
    card: "rgba(255,255,255,0.9)",
    cardBorder: "rgba(0,0,0,0.08)",
    texto: "#1a1a1a",
    textoSec: "rgba(0,0,0,0.7)",
    textoTer: "rgba(0,0,0,0.4)",
    navbar: "rgba(255,255,255,0.98)",
    navBorder: "rgba(253,119,81,0.25)",
    input: "rgba(0,0,0,0.04)",
    inputBorder: "rgba(0,0,0,0.12)",
    inputTexto: "#1a1a1a",
    stickyHeader: "rgba(245,245,247,0.95)",
  },
};

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem("cltiene_tema");
    return guardado === "claro" ? "claro" : "oscuro";
  });

  useEffect(() => {
    localStorage.setItem("cltiene_tema", tema);
    if (tema === "claro") {
      document.documentElement.classList.add("tema-claro");
      document.body.classList.add("tema-claro");
    } else {
      document.documentElement.classList.remove("tema-claro");
      document.body.classList.remove("tema-claro");
    }
  }, [tema]);

  const toggleTema = () => setTema(t => t === "oscuro" ? "claro" : "oscuro");
  const colores = temas[tema];

  return (
    <ThemeContext.Provider value={{ tema, colores, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { tema, toggleTema } = useTheme();
  return (
    <button
      onClick={toggleTema}
      title={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        background: tema === "oscuro" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        border: tema === "oscuro" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 20,
        transition: "all 0.3s ease",
      }}
    >
      {tema === "oscuro" ? "☀️" : "🌙"}
    </button>
  );
}
