import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não suportado. Utilize POST.' });
  }

  const { dados_do_paciente } = req.body;

  if (!dados_do_paciente) {
    return res.status(400).json({ error: 'Dados do paciente ausentes ou inválidos.' });
  }

  // Consumir de forma flexível as chaves de ambiente usuais
  const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_API_KEY não configurada no servidor.');
    return res.status(500).json({ error: 'Chave de API do Google Gen AI (GOOGLE_API_KEY) não está configurada no servidor.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${JSON.stringify(dados_do_paciente, null, 2)}

⚠️ Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
Repita estruturado para os 7 dias da semana (Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado e Domingo). Cada refeição deve ter exatamente 5 opções de itens práticos.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsedData;
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Erro ao fazer parser do JSON retornado pela IA:', text);
      return res.status(500).json({
        error: 'Erro de resposta da IA: o conteúdo gerado não pôde ser analisado como JSON.',
        rawText: text
      });
    }

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Erro na chamada da API do Gemini:', error);
    return res.status(500).json({
      error: 'Erro ao gerar o plano com IA.',
      details: error.message || error
    });
  }
}
