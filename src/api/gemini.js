const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function obtenerNoticiasMundial() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `Busca en internet las últimas noticias reales sobre el Mundial de Fútbol 2026 (USA, México y Canadá). Trae exactamente 5 noticias actuales de fuentes reales como ESPN, FIFA, Marca, AS, BBC, etc.

Responde SOLO con un JSON válido (sin markdown, sin backticks, sin texto adicional) con este formato exacto:
[
  {
    "titulo": "Título real de la noticia",
    "resumen": "Resumen de 2-3 oraciones con la información real",
    "categoria": "Una de: Selecciones | Sedes | Clasificación | Jugadores | FIFA",
    "fecha": "Fecha de la noticia",
    "fuente": "Nombre del medio real de donde viene la noticia"
  }
]`;

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
  const text = data.candidates[0].content.parts[0].text.trim();
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}
