import client from "./client";

const WORLD_CUP_START_CACHE_KEY = "world-cup-start-v1";
const WORLD_CUP_START_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const NOTICIAS_CACHE_KEY = "noticias-mundial-v2";
const NOTICIAS_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

export async function obtenerNoticiasMundial(forzar = false) {
  if (!forzar) {
    try {
      const cacheCrudo = localStorage.getItem(NOTICIAS_CACHE_KEY);
      if (cacheCrudo) {
        const cache = JSON.parse(cacheCrudo);
        const vigente =
          cache.savedAt && Date.now() - cache.savedAt < NOTICIAS_CACHE_TTL_MS;
        if (vigente && cache.data?.length) return cache.data;
      }
    } catch {}
  }

  try {
    const res = await client.get(
      `/noticias/mundial?limit=5${forzar ? "&forzar=true" : ""}`,
      { timeout: 50000 },
    );
    const data = Array.isArray(res.data) ? res.data : [];
    if (data.length) {
      localStorage.setItem(
        NOTICIAS_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), data }),
      );
      return data;
    }
  } catch {
    if (import.meta.env.DEV)
      console.warn("Backend falló, usando fallback estático");
  }

  return [
    {
      titulo: "Todo sobre el Mundial 2026",
      resumen:
        "La Copa del Mundo FIFA 2026 se celebrará en Estados Unidos, México y Canadá con 48 selecciones. Será el torneo más grande de la historia del fútbol.",
      categoria: "FIFA",
      fecha: new Date().toISOString().slice(0, 10),
      fuente: "FIFA",
      url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026",
    },
  ];
}

export async function obtenerInicioMundial() {
  const fallback = {
    targetDate: "2026-06-11T21:00:00-05:00",
    titulo: "USA - México - Canadá 2026",
    fuente: "FIFA",
    url: "https://inside.fifa.com",
  };

  try {
    const cacheCrudo = localStorage.getItem(WORLD_CUP_START_CACHE_KEY);
    if (cacheCrudo) {
      const cache = JSON.parse(cacheCrudo);
      const vigente =
        cache.savedAt &&
        Date.now() - cache.savedAt < WORLD_CUP_START_CACHE_TTL_MS;
      if (vigente && cache.data?.targetDate && !cache.data.targetDate.includes('T00:00:00')) return cache.data;
    }
  } catch {}

  return fallback;
}
