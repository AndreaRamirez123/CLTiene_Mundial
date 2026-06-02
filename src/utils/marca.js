import logoDefault from "../assets/logo.png";
import { sGet, sSet, getEmpresaSlug } from "./storage";

export const leerConfigMarca = () => {
  try {
    const raw = sGet("config_marca");
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
  return null;
};

const DEFAULTS_MARCA = {
  color_primario: "#FD7751",
  color_secundario: "#ED1E28",
  color_acento: "#ECA82D",
  color_fondo: "#0f0a1e",
};

export const aplicarConfigMarca = (config) => {
  if (!config || typeof document === "undefined") return;
  const root = document.documentElement;

  if (config.nombre_app) document.title = config.nombre_app;

  // El favicon lo controla index.html — no se toca desde JS
  // Siempre aplica (usa default si el valor viene null/vacío)
  const primario = config.color_primario || DEFAULTS_MARCA.color_primario;
  const secundario = config.color_secundario || DEFAULTS_MARCA.color_secundario;
  const acento = config.color_acento || DEFAULTS_MARCA.color_acento;
  const fondo = config.color_fondo || DEFAULTS_MARCA.color_fondo;

  root.style.setProperty("--brand-primary", primario);
  root.style.setProperty("--brand-secondary", secundario);
  root.style.setProperty("--brand-accent", acento);
  root.style.setProperty("--brand-bg", fondo);
  root.style.setProperty("--bg", fondo);

  const rgbPrimario = hexToRgb(primario);
  if (rgbPrimario) {
    root.style.setProperty("--brand-primary-rgb", rgbPrimario);
    root.style.setProperty("--nav-border", `rgba(${rgbPrimario}, 0.2)`);
  }

  const rgbAcento = hexToRgb(acento);
  if (rgbAcento) root.style.setProperty("--brand-accent-rgb", rgbAcento);
};

export const guardarConfigMarca = (config) => {
  if (!config) return;
  sSet("config_marca", JSON.stringify({ ...config, _slug: getEmpresaSlug() }));
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

// Lista de videos de la marca configurados en el admin (cada uno: { id, url }).
export const getVideosMarca = () => {
  const config = leerConfigMarca();
  if (!config?.videos_json) return [];
  try {
    const arr = JSON.parse(config.videos_json);
    return Array.isArray(arr) ? arr.filter((v) => v?.url) : [];
  } catch {
    return [];
  }
};

const resolverUrlVideo = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
  return url;
};

// Calcula el día del año actual (1-366) en zona Colombia.
const diaDelAnio = () => {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), 0, 0);
  const diffMs = ahora.getTime() - inicio.getTime();
  return Math.floor(diffMs / 86400000);
};

// Devuelve la URL del video que toca hoy (rotación día_del_año % length).
// Si no hay videos configurados, retorna "" y la misión no debe mostrarse.
export const getVideoDelDia = () => {
  const videos = getVideosMarca();
  if (videos.length === 0) return "";
  const indice = (diaDelAnio() - 1 + videos.length) % videos.length;
  return resolverUrlVideo(videos[indice]?.url);
};
