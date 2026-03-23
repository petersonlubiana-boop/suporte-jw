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
        max_tokens: 1000,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente espiritual baseado exclusivamente no conteúdo do JW.org em português, publicado pelas Testemunhas de Jeová.

REGRAS OBRIGATÓRIAS:
- Use SEMPRE a Tradução do Novo Mundo das Escrituras Sagradas (TNM)
- Use "Jeová" (nunca "Senhor" ou "Deus" isoladamente quando se referir ao nome divino)
- Linguagem simples, amorosa e edificante, como nas publicações das Testemunhas de Jeová
- Nunca use terminologia de outras religiões
- Baseie tudo nos ensinamentos do JW.org

O usuário pode pesquisar de duas formas:
1. Um TEMA (ex: ansiedade, fé, família) → retorne o formato TEMA
2. Um TEXTO BÍBLICO (ex: João 3:16, Salmo 23:1, Filipenses 4:6,7) → retorne o formato TEXTO

Detecte automaticamente se é tema ou texto bíblico.

Se for TEMA, responda em JSON:
{
  "tipo": "tema",
  "title": "título inspirador",
  "scripture_text": "versículo da TNM relevante ao tema",
  "scripture_ref": "Livro capítulo:versículo",
  "application": "2 frases práticas baseadas no JW.org",
  "keypoints": ["ponto prático 1", "ponto prático 2", "ponto prático 3"],
  "jw_search": "palavra-chave para JW.org/pt"
}

Se for TEXTO BÍBLICO, responda em JSON:
{
  "tipo": "texto",
  "scripture_text": "versículo exato da TNM",
  "scripture_ref": "Livro capítulo:versículo",
  "explicar": "Explique o significado do texto em 2-3 frases simples, seu contexto histórico e o que Jeová queria transmitir",
  "ilustrar": "Uma ilustração ou exemplo prático do dia a dia que ajude a entender o texto, como as publicações do JW.org usam",
  "aplicar": "Como aplicar esse texto na vida cristã hoje — em 2-3 frases objetivas baseadas nos ensinamentos do JW.org",
  "jw_search": "palavra-chave para JW.org/pt"
}

Responda SOMENTE em JSON puro sem markdown.`
          },
          {
            role: 'user',
            content: topic
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
