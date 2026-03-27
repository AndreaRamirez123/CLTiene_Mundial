const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const WORLD_CUP_START_CACHE_KEY = "world-cup-start-v1";
const WORLD_CUP_START_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

async function generarContenidoConGemini(prompt, conFuentes = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", res.status, err);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  if (conFuentes) {
    // Extraer URLs reales del groundingMetadata
    const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks
      .filter(c => c.web?.uri && !c.web.uri.includes("vertexaisearch"))
      .map(c => ({ uri: c.web.uri, title: c.web.title || "" }));
    return { text: clean, urls };
  }

  return clean;
}

const NOTICIAS_CACHE_KEY = "noticias-mundial-v1";
const NOTICIAS_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos

export async function obtenerNoticiasMundial(forzar = false) {
  // Revisar caché
  if (!forzar) {
    try {
      const cacheCrudo = localStorage.getItem(NOTICIAS_CACHE_KEY);
      if (cacheCrudo) {
        const cache = JSON.parse(cacheCrudo);
        const vigente = cache.savedAt && Date.now() - cache.savedAt < NOTICIAS_CACHE_TTL_MS;
        if (vigente && cache.data?.length) return cache.data;
      }
    } catch {}
  }

  const prompt = `Busca en internet las ultimas noticias reales sobre el Mundial de Futbol 2026 (USA, Mexico y Canada). Trae exactamente 5 noticias actuales de fuentes reales.

Responde SOLO con un JSON valido (sin markdown, sin backticks, sin texto adicional) con este formato exacto:
[
  {
    "titulo": "Titulo real de la noticia",
    "resumen": "Resumen de 2-3 oraciones con la informacion real",
    "categoria": "Una de: Selecciones | Sedes | Clasificacion | Jugadores | FIFA",
    "fecha": "Fecha de la noticia",
    "fuente": "Nombre del medio real de donde viene la noticia"
  }
]`;

  const resultado = await generarContenidoConGemini(prompt, true);
  const noticias = JSON.parse(resultado.text);
  const urlsReales = resultado.urls || [];

  // Asignar URLs reales del grounding a cada noticia
  const data = noticias.map((noticia, i) => ({
    ...noticia,
    url: urlsReales[i]?.uri || `https://www.google.com/search?q=${encodeURIComponent(noticia.titulo + " Mundial 2026")}`,
  }));

  // Guardar en caché
  localStorage.setItem(NOTICIAS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));

  return data;
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
      const vigente = cache.savedAt && Date.now() - cache.savedAt < WORLD_CUP_START_CACHE_TTL_MS;
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
    console.error("No se pudo obtener la fecha oficial del Mundial con Gemini", error);
    return fallback;
  }
}
