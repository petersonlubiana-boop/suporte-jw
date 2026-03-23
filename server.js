const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.GROQ_API_KEY;

app.post('/buscar', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Tema não informado' });
  if (!API_KEY) return res.status(500).json({ error: 'Chave de API não configurada' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 600,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente bíblico baseado no JW.org em português. Responda SOMENTE em JSON puro sem markdown. Formato exato: {"title":"título curto e inspirador","scripture_text":"versículo bíblico real e relevante","scripture_ref":"Livro capítulo:versículo","application":"2 frases objetivas de como aplicar isso hoje","keypoints":["ponto prático 1","ponto prático 2","ponto prático 3"],"jw_search":"palavra-chave em português"}. Use versículos reais. Linguagem simples.'
          },
          {
            role: 'user',
            content: `Pesquisa bíblica sobre: ${topic}`
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data).slice(0, 300));

    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const obj = JSON.parse(clean);
    res.json(obj);

  } catch(e) {
    console.error('Erro:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
