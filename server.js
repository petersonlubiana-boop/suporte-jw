const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/buscar', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Tema não informado' });
  if (!API_KEY) return res.status(500).json({ error: 'Chave de API não configurada' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: 'Assistente bíblico baseado no JW.org/pt. Responda SOMENTE em JSON puro sem markdown. Formato: {"title":"...","scripture_text":"...","scripture_ref":"...","application":"...","keypoints":["...","...","..."],"jw_search":"..."}. Use versículos reais. Linguagem simples.',
        messages: [{ role: 'user', content: `Pesquisa bíblica sobre: ${topic}` }]
      })
    });

    const data = await response.json();
    console.log('Resposta API:', JSON.stringify(data).slice(0, 200));

    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = (data.content || []).map(b => b.text || '').join('').trim();
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(obj);

  } catch(e) {
    console.error('Erro:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
