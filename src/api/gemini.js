import client from "./client";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const WORLD_CUP_START_CACHE_KEY = "world-cup-start-v1";
const WORLD_CUP_START_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

async function generarContenidoConGemini(prompt, conFuentes = false) {
  if (!API_KEY) {
    throw new Error("Falta VITE_GEMINI_API_KEY");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // SIN herramientas
    }),
  }).finally(() => clearTimeout(timeoutId));

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", res.status, err);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  const clean = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  if (conFuentes) {
    const metadata = data.candidates?.[0]?.groundingMetadata || {};
    console.log("Grounding metadata:", JSON.stringify(metadata, null, 2));

    // Extraer URLs de groundingChunks
    const chunks = metadata.groundingChunks || [];
    // Extraer URLs de groundingSupports (mapeo texto -> fuente)
    const supports = metadata.groundingSupports || [];

    // Recopilar todas las URLs únicas reales
    const urlSet = new Map();
    chunks.forEach((c) => {
      if (c.web?.uri) urlSet.set(c.web.uri, c.web.title || "");
    });
    supports.forEach((s) => {
      (s.groundingChunkIndices || []).forEach((idx) => {
        const chunk = chunks[idx];
        if (chunk?.web?.uri) urlSet.set(chunk.web.uri, chunk.web.title || "");
      });
    });

    const urls = Array.from(urlSet.entries()).map(([uri, title]) => ({
      uri,
      title,
    }));
    return { text: clean, urls };
  }

  return clean;
}

const NOTICIAS_CACHE_KEY = "noticias-mundial-v2";
const NOTICIAS_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos

function parseNoticiasSeguro(texto) {
  if (!texto) throw new Error("Respuesta vacia de Gemini");
  const intentar = (t) => {
    const parsed = JSON.parse(t);
    if (!Array.isArray(parsed)) {
      throw new Error("Formato inesperado de noticias");
    }
    return parsed;
  };

  try {
    return intentar(texto);
  } catch {}

  const match = texto.match(/\[[\s\S]*\]/);
  if (match?.[0]) {
    try {
      return intentar(match[0]);
    } catch {}
  }

  const limpiado = texto
    .replace(/^\s*[\s\S]*?\[/, "[")
    .replace(/\][\s\S]*?$/, "]")
    .replace(/,\s*]/g, "]");

  return intentar(limpiado);
}

export async function obtenerNoticiasMundial(forzar = false) {
  // Revisar caché
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

  // Intentar backend primero
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
  } catch (error) {
    console.warn("Backend falló, intentando Gemini directo");
  }

  // Mapeo de fuentes a sus portadas del Mundial 2026 (URLs que SIEMPRE funcionan)
  const urlsFuentes = {
    FIFA: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026",
    ESPN: "https://www.espn.com/soccer/fifa-world-cup",
    Marca: "https://www.marca.com/futbol/mundial.html",
    AS: "https://as.com/futbol/mundial/",
    BBC: "https://www.bbc.com/sport/football/world-cup",
    "Fox Sports": "https://www.foxsports.com/soccer/fifa-world-cup",
    UEFA: "https://www.uefa.com/worldcup/",
  };

  // Intentar Gemini con grounding
  try {
    const prompt = `Busca las 5 noticias más recientes y reales sobre el Mundial de Fútbol 2026. Para cada una dame titulo, resumen de 5-10 oraciones, categoria (Selecciones|Sedes|Clasificacion|Jugadores|FIFA), fecha YYYY-MM-DD, y fuente. Responde SOLO con JSON válido (sin markdown): [{"titulo":"...","resumen":"...","categoria":"...","fecha":"...","fuente":"..."}]`;

    const resultado = await generarContenidoConGemini(prompt, true);
    const noticias = parseNoticiasSeguro(resultado.text);

    // Usar URLs reales del grounding, o portadas como fallback seguro
    const groundingUrls = (resultado.urls || []).filter(
      (u) => u.uri && u.title,
    );

    const data = noticias.map((noticia) => {
      // Buscar en grounding una URL que coincida con el título
      const palabras = (noticia.titulo || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 4);

      let mejorUrl = null;
      let mejorScore = 0;
      for (const g of groundingUrls) {
        const title = (g.title || "").toLowerCase();
        const score = palabras.filter((p) => title.includes(p)).length;
        if (score > mejorScore) {
          mejorScore = score;
          mejorUrl = g.uri;
        }
      }

      return {
        ...noticia,
        url:
          mejorScore >= 2
            ? mejorUrl
            : urlsFuentes[noticia.fuente] || urlsFuentes["FIFA"],
      };
    });

    if (data.length) {
      localStorage.setItem(
        NOTICIAS_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), data }),
      );
      return data;
    }
  } catch {
    console.warn("Gemini falló, usando fallback estático");
  }

  // Fallback final: noticias con URLs de portadas que siempre funcionan
  return [
    {
      titulo: "Todo sobre el Mundial 2026",
      resumen:
        "La Copa del Mundo FIFA 2026 se celebrará en Estados Unidos, México y Canadá con 48 selecciones. Será el torneo más grande de la historia del fútbol.",
      categoria: "FIFA",
      fecha: new Date().toISOString().slice(0, 10),
      fuente: "FIFA",
      url: urlsFuentes["FIFA"],
    },
  ];
}

export async function obtenerInicioMundial() {
  const fallback = {
    targetDate: "2026-06-11T00:00:00-05:00",
    titulo: "USA - Mexico - Canada 2026",
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
      if (vigente && cache.data?.targetDate) return cache.data;
    }
  } catch (error) {
    console.warn("No se pudo leer el cache del inicio del Mundial", error);
  }

  if (!API_KEY) return fallback;

  const prompt = `Busca en internet la fecha oficial del inicio de la Copa Mundial de la FIFA 2026 usando fuentes oficiales de FIFA.

Responde SOLO con un JSON valido (sin markdown, sin backticks, sin texto adicional) con esta estructura exacta:
{
  "targetDate": "Fecha ISO 8601. Si solo encuentras la fecha y no la hora oficial, usa 2026-06-11T00:00:00-05:00",
  "titulo": "Texto corto para mostrar en la tarjeta",
  "fuente": "Fuente oficial",
  "url": "URL oficial"
}

Usa solo informacion real y confirmada. Prioriza FIFA.`;

  try {
    const clean = await generarContenidoConGemini(prompt);
    const data = { ...fallback, ...JSON.parse(clean) };
    if (!data.targetDate) return fallback;

    localStorage.setItem(
      WORLD_CUP_START_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data }),
    );

    return data;
  } catch (error) {
    console.error(
      "No se pudo obtener la fecha oficial del Mundial con Gemini",
      error,
    );
    return fallback;
  }
}
