const express = require('express');
const { scrapingDinamico } = require('./scraper');
const app = express();
const PORT = 3000;

app.get('/results', async (req, res) => {
  try {
    const resultados = await scrapingDinamico();
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});