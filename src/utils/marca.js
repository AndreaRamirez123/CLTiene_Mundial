import logoDefault from "../assets/logo.png";

export const leerConfigMarca = () => {
  try {
    const raw = localStorage.getItem("config_marca");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const hexToRgb = (hex) => {
  if (!hex) return null;
  const limpio = String(hex).replace("#", "").trim();
  const valido = limpio.length === 3 || limpio.length === 6;
  if (!valido) return null;
  const full = limpio.length === 3
    ? limpio.split("").map((c) => c + c).join("")
    : limpio;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return `${r}, ${g}, ${b}`;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const resolverUrlLogo = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
  return url;
};

export const aplicarConfigMarca = (config) => {
  if (!config || typeof document === "undefined") return;
  const root = document.documentElement;

  if (config.nombre_app) document.title = config.nombre_app;

  // Favicon dinámico
  const logoUrl = resolverUrlLogo(config.logo_url) || logoDefault;
  const existente = document.querySelector("link[rel*='icon']");
  if (existente) existente.remove();
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = logoUrl;
  document.head.appendChild(link);
  if (config.color_primario) root.style.setProperty("--brand-primary", config.color_primario);
  if (config.color_secundario) root.style.setProperty("--brand-secondary", config.color_secundario);
  if (config.color_acento) root.style.setProperty("--brand-accent", config.color_acento);
  if (config.color_fondo) {
    root.style.setProperty("--brand-bg", config.color_fondo);
    root.style.setProperty("--bg", config.color_fondo);
  }

  const rgbPrimario = hexToRgb(config.color_primario);
  if (rgbPrimario) {
    root.style.setProperty("--brand-primary-rgb", rgbPrimario);
    root.style.setProperty("--nav-border", `rgba(${rgbPrimario}, 0.2)`);
  }

  const rgbAcento = hexToRgb(config.color_acento);
  if (rgbAcento) root.style.setProperty("--brand-accent-rgb", rgbAcento);
};

export const guardarConfigMarca = (config) => {
  if (!config) return;
  localStorage.setItem("config_marca", JSON.stringify(config));
  aplicarConfigMarca(config);
};

export const getLogoMarca = () => {
  const config = leerConfigMarca();
  return resolverUrlLogo(config?.logo_url) || logoDefault;
};

export const getNombreMarca = () => {
  const config = leerConfigMarca();
  return config?.nombre_app || "CLTiene Mundial";
};

export const getSubtituloMarca = () => {
  const config = leerConfigMarca();
  return config?.subtitulo || "Mundial 2026";
};

export const getPublicidadMarca = () => {
  const config = leerConfigMarca();
  if (!config?.publicidad_json) return [];
  try {
    const parsed = JSON.parse(config.publicidad_json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
