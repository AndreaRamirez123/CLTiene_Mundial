
const puppeteer = require('puppeteer');

/**
 * Extrae resultados de partidos terminados desde FlashScore
 * @returns {Promise<Array>} Array de objetos con equipo1, equipo2, marcador, hora
 */
async function scrapingDinamico() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navegar a FlashScore y esperar a que cargue el contenido
    await page.goto('https://www.flashscore.com/football/', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Extraer partidos terminados
    const resultados = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div.event__match'))
        .slice(0, 20) // Limitar a 20 partidos
        .map(el => {
          const participantes = el.querySelectorAll('span.event__participant');
          const marcador = el.querySelector('span.event__score');
          const hora = el.querySelector('span.event__time')?.textContent.trim() || null;

          return {
            equipo1: participantes[0]?.textContent.trim() || 'Desconocido',
            equipo2: participantes[1]?.textContent.trim() || 'Desconocido',
            marcador: marcador?.textContent || '-',
            hora: hora
          };
        })
        .filter(result => result.marcador !== '-' && result.marcador !== 'EN VIVO');
    });

    await browser.close();
    return resultados;
  } catch (error) {
    await browser.close();
    throw new Error(`Error al extraer datos: ${error.message}`);
  }
}

module.exports = { scrapingDinamico };