import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  generateFallbackAnalysis,
  sanitizeAndValidateAnalysis,
  generateFallbackImprovedAd,
  sanitizeImprovedAdText,
} from "./src/lib/adAnalysis";
import { generateFallbackTitles, sanitizeAndValidateTitles } from "./src/lib/titleGenerator";
import { generateFallbackChecklist, sanitizeAndValidateChecklist } from "./src/lib/adChecklist";
import { generateFallbackPhotoAnalysis, sanitizeAndValidatePhotoAnalysis } from "./src/lib/photoAnalysis";
import {
  generateFallbackAd,
  sanitizeGeneratedAd,
  validateAdInput,
} from "./src/lib/adGeneratorCore";
import { adminMetrics } from "./server/adminMetrics";
import { adminProtection } from "./server/adminProtection";
import { aiRateLimitMiddleware } from "./server/rateLimiter";

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function cleanAndParseJSON(rawText: string) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned.trim());
}

interface GeminiCallParams {
  contents: any;
  config: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    [key: string]: any;
  };
  timeoutMs?: number;
  models?: string[];
}

async function generateWithResilience(client: GoogleGenAI, params: GeminiCallParams) {
  // Ordered models: gemini-3.1-flash-lite is the fastest and most available, followed by gemini-3.8-flash and gemini-flash-latest
  const candidateModels = params.models || ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  const timeoutMs = params.timeoutMs || 8000;
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout de ${timeoutMs}ms ao chamar modelo ${model}`)), timeoutMs)
        );

        const callPromise = client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        const response: any = await Promise.race([callPromise, timeoutPromise]);

        if (response && response.text) {
          return { response, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = String(err?.message || "");
        const status = err?.status || err?.code || err?.error?.code;

        // If timeout, switch to next model immediately
        if (errMessage.includes("Timeout")) {
          console.log(`[Gemini API] ${errMessage}. Alternando para modelo alternativo...`);
          break;
        }

        // If model is deprecated or not found (404), immediately failover to next candidate model
        if (status === 404 || errMessage.includes("404") || errMessage.includes("no longer available")) {
          console.log(`[Gemini API] Modelo ${model} indisponível ou descontinuado. Alternando para o próximo modelo...`);
          break;
        }

        // If quota exceeded (429 / RESOURCE_EXHAUSTED), immediately switch model (retrying same model will fail)
        const isQuotaExceeded =
          status === 429 ||
          status === "RESOURCE_EXHAUSTED" ||
          errMessage.includes("429") ||
          errMessage.includes("quota") ||
          errMessage.includes("RESOURCE_EXHAUSTED");

        if (isQuotaExceeded) {
          console.log(`[Gemini API] Modelo ${model} com cota temporariamente esgotada (429). Alternando para próximo modelo...`);
          break;
        }

        // If model is experiencing temporary high demand (503 / UNAVAILABLE)
        const isUnavailable =
          status === "UNAVAILABLE" ||
          status === 503 ||
          errMessage.includes("503") ||
          errMessage.includes("high demand") ||
          errMessage.includes("overloaded");

        if (isUnavailable) {
          if (attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          } else {
            console.log(`[Gemini API] Modelo ${model} com alta demanda (503). Alternando para próximo modelo...`);
            break;
          }
        }
        break;
      }
    }
  }

  throw lastError;
}

// Fallback generator in case Gemini API key is not configured or temporary error occurs
// CRITICAL INTEGRITY RULES:
// 1. Público-alvo: orienta tom e posicionamento, NUNCA é tratado como característica do produto.
// 2. Preservar todas as características: não omitir nenhuma e nunca inventar dados não fornecidos.
// 3. Benefícios: não considerar preço, marca, produto ou CTA como benefício. Se houver poucos diferenciais, informar claramente.
// 4. Zero colchetes no anúncio: a versão final é 100% utilizável. Informações ausentes vão em optionalAdditions.
// generateFallbackAd, sanitizeGeneratedAd and validateAdInput are imported from ./src/lib/adGeneratorCore

// Fallback and integrity analysis functions are imported from ./src/lib/adAnalysis

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Track session heartbeat
  app.post("/api/track-session", (req, res) => {
    const sessionId = req.body?.sessionId || req.headers["x-session-id"];
    if (sessionId && typeof sessionId === "string") {
      adminMetrics.recordSession(sessionId);
    }
    res.json({ ok: true });
  });

  // API Route for registering verified app events (ad_generated, ad_analyzed)
  app.post("/api/record-event", (req, res) => {
    try {
      const { event, eventId, sessionId, category, score, scoreLabel } = req.body || {};
      if (event !== "ad_generated" && event !== "ad_analyzed") {
        return res.status(400).json({ error: "Tipo de evento inválido." });
      }

      const sid = sessionId || req.headers["x-session-id"];
      const result = adminMetrics.recordEvent({
        event,
        eventId: typeof eventId === "string" ? eventId : undefined,
        sessionId: typeof sid === "string" ? sid : undefined,
        category: typeof category === "string" ? category : undefined,
        score: typeof score === "number" ? score : undefined,
        scoreLabel: typeof scoreLabel === "string" ? scoreLabel : undefined,
      });

      return res.json(result);
    } catch (err: any) {
      console.error("Erro ao registrar evento de telemetria:", err);
      return res.status(500).json({ error: "Falha ao registrar evento." });
    }
  });

  // API Route for generating ads (protected by AI rate limiter)
  app.post("/api/generate-ad", aiRateLimitMiddleware, async (req, res) => {
    const sessionId = (req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const eventId = (req.body?.eventId || "gen_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as string;

    try {
      if (sessionId && typeof sessionId === "string") {
        adminMetrics.recordSession(sessionId);
      }

      const { productName, category, price, targetAudience, features, tone, platform } = req.body;

      if (!productName || !features) {
        return res.status(400).json({
          error: "O nome do produto e as características principais são obrigatórios.",
        });
      }

      const client = getGeminiClient();

      if (!client) {
        console.log("[Info] GEMINI_API_KEY não configurada. Usando gerador estruturado.");
        const fallback = generateFallbackAd({
          productName,
          category: category || "Diversos",
          price: price || "Consulte-nos",
          targetAudience: targetAudience || "Público em geral",
          features,
          tone: tone || "vendedor",
          platform: platform || "Multicanal",
        });
        adminMetrics.recordEvent({
          event: "ad_generated",
          eventId,
          sessionId: typeof sessionId === "string" ? sessionId : undefined,
          category: category || "Diversos",
        });
        return res.json({ ...fallback, eventId });
      }

      const prompt = `
Crie um anúncio para o seguinte produto com base ESTRITAMENTE nas informações fornecidas pelo vendedor:

- Nome do Produto: ${productName}
- Categoria: ${category || "Geral"}
- Preço: ${price || "A combinar / Sob consulta"}
- Público-alvo: ${targetAudience || "Geral"}
- Principais Características informadas: ${features}
- Tom do Anúncio: ${tone || "vendedor"}
- Canal de Venda / Formato de Destino: ${platform || "Todos / Multicanal"}

REGRA PRINCIPAL: A IA DEVE TRATAR AS INFORMAÇÕES FORNECIDAS COMO A ÚNICA FONTE DE VERDADE SOBRE O PRODUTO.
Tudo o que aparecer no anúncio deve estar explicitamente informado pelo usuário ou ser uma reformulação neutra e fiel dessas informações.
Adequar a estrutura ao canal escolhido (${platform || "Multicanal"}), sem inventar nenhuma especificação, garantia, estoque ou característica.

O QUE A IA PODE FAZER:
- organizar informações;
- melhorar gramática;
- melhorar clareza;
- melhorar estrutura;
- tornar a comunicação mais natural;
- transformar frases informais em frases mais profissionais.

O QUE A IA NÃO PODE FAZER (PROIBIÇÃO ABSOLUTA):
- adicionar características;
- adicionar especificações;
- adicionar benefícios não informados;
- adicionar garantias;
- adicionar nota fiscal;
- adicionar autenticidade ou originalidade ("autêntica", "original", "oficial");
- adicionar medidas ou dimensões;
- adicionar tamanhos;
- adicionar estoque;
- adicionar prazo de entrega ou envio;
- adicionar política de troca;
- adicionar informações técnicas não fornecidas;
- adicionar urgência;
- adicionar escassez;
- adicionar qualquer afirmação factual que não esteja sustentada pelo texto fornecido.

REGRA RIGOROSA DE PRESERVAÇÃO DE SIGNIFICADO:
- Se o usuário informar "resistente a respingos de água" (ou "resistente a respingos"): NUNCA transforme em "resistente à água", "à prova d'água" ou "impermeável".
- Se o usuário informar "praticamente novo, usei 2x" ou "seminovo, usado 2 vezes": NUNCA transforme em "novo, sem uso" ou "novo".
- Se o usuário informar "em bom estado": NUNCA transforme em "impecável" ou "perfeito estado".
- Mantenha a condição e as propriedades exatamente na proporção informada pelo vendedor!

REGRA ESTRITA PARA CTAs (CHAMADAS PARA AÇÃO):
- Nunca use nos CTAs palavras ou frases que impliquem informações não fornecidas pelo usuário sobre:
  • disponibilidade
  • estoque
  • quantidade de unidades
  • últimas unidades
  • escassez
- Exemplos PROIBIDOS quando não informados pelo usuário:
  • "consulte disponibilidade"
  • "verifique a disponibilidade"
  • "últimas unidades"
  • "estoque limitado"
  • "garanta o seu antes que acabe"
- Quando o usuário não informar disponibilidade/estoque, use SOMENTE CTAs neutros baseados em interesse/contato, como:
  • "Entre em contato para saber mais."
  • "Chame no privado para mais informações."
  • "Fale comigo se tiver interesse."

BENEFÍCIOS REAIS E DINÂMICOS (NÃO FORCE UMA QUANTIDADE FIXA):
- NÃO force uma quantidade fixa de benefícios (se o usuário fornecer apenas 1 característica real, retorne SOMENTE 1 benefício).
- NUNCA use frases como "Poucos diferenciais informados pelo usuário no cadastro."
- Não transforme características genéricas em afirmações não comprovadas.
  Exemplos:
  • "fone Bluetooth, leve e bateria de longa duração" -> Apenas benefícios diretos: "Conexão sem fio Bluetooth", "Estrutura leve", "Bateria de longa duração". NÃO invente "Confortável por horas", "Som de alta qualidade", "Ideal para estudar", "Perfeito para academia".
  • "creme hidratante" com apenas "hidrata a pele" -> Retorne SOMENTE 1 benefício: "Hidrata a pele". NÃO invente anti-idade, rejuvenescimento, toque seco ou ação clareadora.
  • "smartphone" com apenas "tela grande e boa câmera" -> Destaque SOMENTE tela grande e boa câmera. NÃO invente megapixels, processador ou bateria.

VERIFICAÇÃO MENTAL PRÉVIA DAS INFORMAÇÕES (Faça antes de gerar):
- PRODUTO: informado?
- MARCA: informada?
- PREÇO: informado?
- COR: informada?
- ESTADO: informado?
- CARACTERÍSTICAS: informadas?
- ESPECIFICAÇÕES: informadas?
- OUTRAS INFORMAÇÕES: informadas?
Se qualquer item não foi informado, a IA NÃO deve deduzir.

CASOS DE CONTROLE E VALIDAÇÃO:
1. Bolsa preta sem material -> NÃO invente couro, sintético ou alta durabilidade.
2. Fone Bluetooth sem garantia -> NÃO invente garantia de X meses ou garantia inclusa.
3. Produto usado sem nota fiscal -> NÃO invente que acompanha nota fiscal.
4. Mesa branca sem medidas -> NÃO invente medidas como 1,20m x 0,80m.
5. Camiseta sem estoque -> NÃO invente últimas peças ou estoque limitado.
6. Livro sem prazo de entrega -> NÃO invente envio em 24h ou entrega rápida.
7. Smartphone com apenas "tela grande e boa câmera" -> Apenas destaque esses dois pontos.
8. Creme hidratante com apenas "hidrata a pele" -> Apenas 1 benefício: hidratação da pele.
9. Produto "resistente a respingos" -> Manter estritamente resistente a respingos.
10. Produto "seminovo, usado 2 vezes" -> Manter seminovo, usado 2 vezes.
11. Produto "em bom estado" -> Manter em bom estado.
12. Fone Bluetooth com apenas "leve e bateria de longa duração" -> Apenas esses 2 benefícios.

INFORMAÇÕES ADICIONAIS E ZERO COLCHETES:
- NUNCA coloque colchetes como "[informe tamanho]" ou "[informe frete]" no anúncio final.
- Coloque sugestões de informações faltantes exclusivamente no campo "optionalAdditions".
`;

      const { response, modelUsed } = await generateWithResilience(client, {
        contents: prompt,
        config: {
          systemInstruction:
            "Você é o AnunciaAI. REGRA ABSOLUTA: Você trata as informações do usuário como a ÚNICA FONTE DE VERDADE. NUNCA invente características, especificações, benefícios, garantias, nota fiscal, medidas, estoque, prazo de entrega ou autenticidade. Preserve o significado exato (respingo NUNCA vira à prova d'água; seminovo/usado 2 vezes NUNCA vira novo; em bom estado NUNCA vira impecável). CTAs: Nunca use termos de disponibilidade, estoque, últimas unidades ou escassez se não informados pelo usuário; use somente CTAs neutros baseados em interesse/contato ('Entre em contato para saber mais.', 'Chame no privado para mais informações.', 'Fale comigo se tiver interesse.'). Zero colchetes.",
          responseMimeType: "application/json",
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Título atrativo, natural e factual, sem adjetivos inventados e sem colchetes",
              },
              fullDescription: {
                type: Type.STRING,
                description:
                  "Descrição completa baseada estritamente nas informações fornecidas, sem inventar toque, frescor ou estoque",
              },
              benefits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "Lista contendo SOMENTE os benefícios reais sustentados pelas características informadas pelo usuário. Se houver apenas 1 ou 2 diferenciais, retorne SOMENTE esses 1 ou 2 itens. NUNCA invente benefícios para completar 5 itens e NUNCA use frases como 'Poucos diferenciais informados pelo usuário no cadastro.'",
              },
              shortText: {
                type: Type.STRING,
                description:
                  "Texto curto, direto e pronto para WhatsApp ou redes sociais, sem colchetes e sem dados inventados",
              },
              callToActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exatamente 3 chamadas para ação genéricas e seguras (sem urgência, estoque ou promoção)",
              },
              optionalAdditions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "Lista de informações que podem ser adicionadas pelo vendedor (tamanhos, cores, frete, formas de pagamento)",
              },
            },
            required: [
              "title",
              "fullDescription",
              "benefits",
              "shortText",
              "callToActions",
              "optionalAdditions",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta vazia do modelo Gemini");
      }

      const parsed = cleanAndParseJSON(responseText);
      const sanitized = sanitizeGeneratedAd(parsed, {
        productName,
        category: category || "Geral",
        price: price || "",
        targetAudience: targetAudience || "",
        features,
        tone: tone || "vendedor",
      });
      adminMetrics.recordEvent({
        event: "ad_generated",
        eventId,
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
        category: category || "Geral",
      });
      return res.json({ ...sanitized, eventId });
    } catch (error: any) {
      console.log("[Info] Acionando gerador estruturado de segurança:", error?.message || error);
      // Fallback in case of temporary AI network/quota error
      try {
        const fallback = generateFallbackAd({
          productName: req.body.productName || "Produto",
          category: req.body.category || "Geral",
          price: req.body.price || "Sob consulta",
          targetAudience: req.body.targetAudience || "Clientes",
          features: req.body.features || "Produto conforme informado",
          tone: req.body.tone || "vendedor",
          platform: req.body.platform || "Multicanal",
        });
        adminMetrics.recordEvent({
          event: "ad_generated",
          eventId,
          sessionId: typeof sessionId === "string" ? sessionId : undefined,
          category: req.body.category || "Geral",
        });
        return res.json({ ...fallback, eventId });
      } catch {
        return res.status(500).json({
          error: "Não foi possível gerar o anúncio no momento. Tente novamente.",
        });
      }
    }
  });

  // API Route for generating product titles (protected by AI rate limiter)
  app.post("/api/generate-titles", aiRateLimitMiddleware, async (req, res) => {
    const sessionId = (req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const eventId = (req.body?.eventId || "tit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as string;

    try {
      if (sessionId && typeof sessionId === "string") {
        adminMetrics.recordSession(sessionId);
      }

      const { productName, category, features, price, platform, style } = req.body;

      if (!productName || !String(productName).trim() || !features || !String(features).trim()) {
        return res.status(400).json({
          error: "O nome do produto e as características são obrigatórios para gerar os títulos.",
        });
      }

      const inputData = {
        productName: String(productName).trim(),
        category: category ? String(category).trim() : "",
        features: String(features).trim(),
        price: price ? String(price).trim() : "",
        platform: platform || "Instagram",
        style: style || "profissional",
      };

      const client = getGeminiClient();
      const isMercadoLivre = inputData.platform === "Mercado Livre";

      if (!client) {
        console.log("[Info] GEMINI_API_KEY não configurada. Usando gerador estruturado de títulos.");
        const fallbackTitles = generateFallbackTitles(inputData);
        const validated = sanitizeAndValidateTitles(fallbackTitles, inputData);
        return res.json({
          titles: validated,
          productName: inputData.productName,
          platform: inputData.platform,
          style: inputData.style,
          eventId,
        });
      }

      const prompt = `
Você é o Gerador Especialista de Títulos de Alta Conversão do AnunciaAI.
Gere opções de títulos linguisticamente naturais, gramaticalmente corretas e com VARIAÇÃO REAL para o produto abaixo, usando ESTRITAMENTE as informações fornecidas pelo usuário:

DADOS INFORMADOS PELO USUÁRIO:
- Nome do Produto: ${inputData.productName}
- Categoria: ${inputData.category || "Não informada"}
- Características informadas: ${inputData.features}
- Preço informado: ${inputData.price || "Não informado"} ${isMercadoLivre ? "(ATENÇÃO: para Mercado Livre é ESTRITAMENTE PROIBIDO colocar preço no título)" : ""}
- Plataforma onde será anunciado: ${inputData.platform}
- Estilo desejado: ${inputData.style}

REGRAS MAIS RIGOROSAS (OBRIGATÓRIAS):
1. CARACTERÍSTICAS DEVEM PRESERVAR SEU SUJEITO E SIGNIFICADO:
   Se o usuário disser "leve", use "Fone Bluetooth Leve".
   É ESTRITAMENTE PROIBIDO transformar em: "Design Leve", "Modelo Leve", "Estrutura Leve", "Construção Leve", "Versão Leve" ou "Acabamento Leve".

2. NÃO CRIAR SINÔNIMOS OU CARACTERÍSTICAS NOVAS:
   Se o usuário disser "leve", NÃO transforme em: "prático", "portátil", "compacto", "confortável", "fácil de transportar".
   Se o usuário disser "bateria de longa duração", NÃO transforme em: "bateria potente", "bateria de alta capacidade", "bateria de 20 horas", "bateria duradoura de alta performance".

3. A CATEGORIA NÃO É UMA CARACTERÍSTICA:
   A categoria (ex: "${inputData.category || "Eletrônicos"}") serve apenas como contexto interno de classificação.
   NUNCA insira a categoria no título como se fosse uma característica do produto (exemplo terminantemente proibido: "Fone Bluetooth Eletrônicos Leve").

4. NÃO ADICIONAR ADJETIVOS GENÉRICOS NÃO INFORMADOS:
   São PROIBIDOS quando não estiverem no input:
   - prático / prática
   - moderno / moderna
   - premium
   - elegante
   - potente
   - confortável / conforto
   - resistente
   - versátil
   - eficiente
   - alta qualidade / excelente qualidade
   - excelente
   - incrível
   - sofisticado / sofisticada
   - inovador / inovadora

5. NÃO ADICIONAR CONTEXTO NÃO INFORMADO:
   Evitar absolutamente frases e clichês como:
   "para o seu dia a dia", "para o dia a dia", "para quem busca...", "ideal para...", "perfeito para...", "feito para...", "para você...", "para sua rotina".
   Priorize títulos descritivos, limpos e objetivos.
${isMercadoLivre ? `
6. REGRA OBRIGATÓRIA PARA MERCADO LIVRE (NUNCA COLOCAR PREÇO):
   A plataforma selecionada é "Mercado Livre". É TERMINANTEMENTE PROIBIDO colocar preço, "R$", valores monetários ou expressões de preço no título do Mercado Livre. O preço pode continuar sendo usado nas outras partes quando apropriado, mas NUNCA no título do Mercado Livre. Os títulos do Mercado Livre devem focar exclusivamente no produto e em suas características reais.
   Crie variações combinando o produto e características reais:
   - Produto com ambas as características (ex: "Fone Bluetooth Leve com Bateria de Longa Duração")
   - Produto destacando a característica 1 (ex: "Fone Bluetooth Leve")
   - Produto destacando a característica 2 (ex: "Fone Bluetooth com Bateria de Longa Duração")
   - Conjunção alternativa (ex: "Fone Bluetooth Leve e com Bateria de Longa Duração")
   - Locução destacada com traço (ex: "Fone Bluetooth com Bateria de Longa Duração - Leve")
` : `
6. DIVERSIDADE REAL (SEM TRUQUES DE PONTUAÇÃO):
   Os títulos não podem ser a mesma frase com pequenas alterações de pontuação (ex: "Fone Leve", "Fone - Leve", "Fone: Leve").
   Crie variações reais combinando os dados fornecidos:
   - Produto com ambas as características (ex: "Fone Bluetooth Leve com Bateria de Longa Duração")
   - Produto destacando a característica 1 (ex: "Fone Bluetooth Leve")
   - Produto destacando a característica 2 (ex: "Fone Bluetooth com Bateria de Longa Duração")
   - Conjunção alternativa (ex: "Fone Bluetooth Leve e com Bateria de Longa Duração")
   - Com preço (se informado): "Fone Bluetooth Leve com Bateria de Longa Duração - ${inputData.price || "R$ 120"}" ou "Fone Bluetooth com Bateria de Longa Duração por ${inputData.price || "R$ 120"}"
`}
7. QUALIDADE > QUANTIDADE:
   Mantenha apenas títulos de alta qualidade real. Nunca invente palavras para preencher lista.

8. REGRAS GRAMATICAIS BÁSICAS:
   "com" só se liga a substantivos/locuções ("com Bateria de Longa Duração"). NUNCA gere "com Leve" ou "com Azul". Adjetivos ligam-se diretamente ao produto ("Fone Bluetooth Leve").

Retorne um JSON com a lista de títulos no array "titles" (até 10 opções válidas).
`;

      const { response } = await generateWithResilience(client, {
        contents: prompt,
        config: {
          systemInstruction:
            `Você é o Gerador de Títulos do AnunciaAI. REGRAS ABSOLUTAS: 1) Preservar sujeito: 'leve' vira 'Fone Bluetooth Leve', NUNCA 'Design Leve' ou 'Modelo Leve'. 2) Zero sinônimos inventados: NÃO use 'prático', 'moderno', 'premium', 'confortável', 'potente'. 3) Categoria NÃO é característica: NUNCA coloque a categoria no título ('Fone Bluetooth Eletrônicos Leve' é PROIBIDO). 4) Sem frases de contexto inventadas ('para o dia a dia', 'para você'). ${isMercadoLivre ? "5) MERCADO LIVRE: NUNCA coloque preço, 'R$', valores ou expressões de preço no título. " : ""}6) Retorne títulos objetivos e naturais no JSON.`,
          responseMimeType: "application/json",
          temperature: 0.2,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista com opções de títulos gramaticalmente corretos, naturais e sem invenções",
              },
            },
            required: ["titles"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta vazia do modelo Gemini");
      }

      const parsed = cleanAndParseJSON(responseText);
      const rawTitles = Array.isArray(parsed?.titles) ? parsed.titles : [];
      const validatedTitles = sanitizeAndValidateTitles(rawTitles, inputData);

      return res.json({
        titles: validatedTitles,
        productName: inputData.productName,
        platform: inputData.platform,
        style: inputData.style,
        eventId,
      });
    } catch (error: any) {
      console.log("[Info] Acionando gerador de segurança estruturado para títulos:", error?.message || error);
      try {
        const inputData = {
          productName: String(req.body?.productName || "Produto").trim(),
          category: req.body?.category ? String(req.body.category).trim() : "",
          features: String(req.body?.features || "").trim(),
          price: req.body?.price ? String(req.body.price).trim() : "",
          platform: req.body?.platform || "Instagram",
          style: req.body?.style || "profissional",
        };
        const fallback = generateFallbackTitles(inputData);
        const validated = sanitizeAndValidateTitles(fallback, inputData);
        return res.json({
          titles: validated,
          productName: inputData.productName,
          platform: inputData.platform,
          style: inputData.style,
          eventId,
        });
      } catch {
        return res.status(500).json({
          error: "Não foi possível gerar os títulos no momento. Tente novamente.",
        });
      }
    }
  });

  // API Route for analyzing ads (protected by AI rate limiter)
  app.post("/api/analyze-ad", aiRateLimitMiddleware, async (req, res) => {
    const sessionId = (req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const eventId = (req.body?.eventId || "ana_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as string;

    try {
      if (sessionId && typeof sessionId === "string") {
        adminMetrics.recordSession(sessionId);
      }

      const { adText } = req.body;

      if (!adText || !adText.trim()) {
        return res.status(400).json({
          error: "Por favor, informe o texto do anúncio para análise.",
        });
      }

      const client = getGeminiClient();

      if (!client) {
        console.log("[Info] GEMINI_API_KEY não configurada. Usando diagnóstico estruturado.");
        const fallback = generateFallbackAnalysis(adText);
        const validated = sanitizeAndValidateAnalysis(fallback, adText);
        adminMetrics.recordEvent({
          event: "ad_analyzed",
          eventId,
          sessionId: typeof sessionId === "string" ? sessionId : undefined,
          score: validated.score,
          scoreLabel: validated.scoreLabel,
        });
        return res.json({ ...validated, eventId });
      }

      const prompt = `
Você é o especialista sênior em copywriting e análise de conversão do AnunciaAI.
Analise criticamente o seguinte anúncio de venda:

"""
${adText}
"""

SIGA RIGOROSAMENTE AS 13 DIRETRIZES ABAIXO:

1. REGRA ABSOLUTA: A IA DEVE TRATAR O ANÚNCIO COMO A ÚNICA FONTE DE VERDADE
   - NUNCA invente, complete ou presuma como verdade qualquer informação sobre o produto que não esteja presente no texto original.
   - Isso inclui: tamanho, cor, material/tecido (ex: não invente couro para bolsas), estado do produto, autenticidade, nota fiscal, garantia, acessórios, estoque, prazo de entrega, formas de pagamento, local de entrega, frete, WhatsApp, Instagram, disponibilidade ou características técnicas.
   - Também não invente dados nos benefícios, texto melhorado, CTAs, recomendações, título ou diagnóstico.
   - Se uma informação importante estiver faltando, aponte separadamente na seção de informações faltantes, SEM INVENTAR no texto melhorado!

2. REGRA RIGOROSA DE PRESERVAÇÃO DE SIGNIFICADO:
   - Se o anúncio disser "resistente a respingos de água" (ou "resistente a respingos"): NUNCA transforme em "resistente à água", "à prova d'água" ou "impermeável".
   - Se o anúncio disser "praticamente novo, usei 2x" ou "seminovo, usado 2 vezes": NUNCA transforme em "novo, sem uso" ou "novo".
   - Se o anúncio disser "em bom estado": NUNCA transforme em "impecável" ou "perfeito estado".
   - Mantenha exatamente o estado e a condição real declarada pelo vendedor.

3. RECONHECER INFORMAÇÕES MESMO QUANDO ESCRITAS DE FORMA DIFERENTE OU INFORMAL:
   - Antes de dizer que algo está faltando, procure cuidadosamente se a informação já aparece no anúncio, mesmo de maneira abreviada, gíria ou com erros de português.
   - Estado informado: "novo", "nunca usado", "sem uso", "seminovo", "praticamente novo", "usado", "pouco usado", "em bom estado", "com sinais de uso", "marcas de uso", "usado 2 vezes", "usei 2x", "bem conservado", "usado 2x", etc.
   - Não exigir que o vendedor escreva literalmente "estado: usado". O mesmo vale para preço, cor, medidas, etc.
   - Exemplos:
     • "camiseta nike 79 reais" -> Produto: informado, Marca: informada, Preço: informado.
     • "camiseta preta M" -> Cor: informada, Tamanho: informado.
     • "iphone 13 128gb" -> Produto: informado, Modelo: informado, Capacidade: informada.
     • "chama pv" -> Contato/CTA: informado, porém status "mal_apresentado".
     • "Retirada em São José dos Campos. Chame no direct." -> Local: informado, Contato: informado.
   - NUNCA, SOB HIPÓTESE ALGUMA, marque como "ausente" uma informação que já está no anúncio!

4. AVALIAÇÃO CRÍTICA DO TÍTULO:
   - Avalie a qualidade real do título:
     • Títulos genéricos, confusos, desorganizados ou cheios de gírias DEVEM receber nota baixa (entre 20 e 35 no critério "Qualidade do título").
     • Exemplo: "vendo camiseta nike 79 reais boa chama pv" -> Título fraco, amador, inicia com "vendo", amontoa preço e usa gírias.
     • "Camiseta Nike Preta Masculina - Tamanho M" -> Título profissional e estruturado.
   - Explique de forma curta e objetiva por que o título é bom ou ruim.

5. PONTUAÇÃO REALISTA DE QUALIDADE (SCORE DE 0 A 100):
   - A nota de 0 a 100 deve representar a QUALIDADE GERAL DO ANÚNCIO, e NÃO simplesmente a quantidade de informações preenchidas.
   - Um anúncio pode ter muitas informações e ainda ser ruim se estiver confuso ou mal escrito.
   - Um anúncio curto pode ter uma nota razoável se for claro, objetivo e tiver as informações importantes.
   - Não penalize exageradamente um anúncio apenas por não possuir benefícios, especialmente quando o produto é simples.
   - Use RIGOROSAMENTE as faixas de referência:
     • Anúncio muito ruim: 20–40 (scoreLabel: "Muito Ruim")
     • Anúncio fraco: 40–59 (scoreLabel: "Fraco")
     • Anúncio razoável: 60–74 (scoreLabel: "Razoável")
     • Anúncio bom: 75–89 (scoreLabel: "Bom")
     • Anúncio excelente: 90–100 (scoreLabel: "Excelente")

6. DIFERENCIE CARACTERÍSTICAS DE BENEFÍCIOS (NÃO FORCE BENEFÍCIOS):
   - "128GB", "cor azul", "tamanho M", "bateria 90%", "Bluetooth" etc. são CARACTERÍSTICAS, não benefícios.
   - Benefício é uma vantagem para o comprador que esteja sustentada pelo anúncio.
   - NUNCA transforme uma característica em um benefício inventado (ex: fone Bluetooth com "leve e bateria de longa duração" -> NÃO invente "Som de alta qualidade", "Confortável para o dia todo").
   - Se o anúncio não apresentar benefícios reais, no critério "Benefícios apresentados" declare exatamente:
     "O anúncio apresenta características do produto, mas não informa benefícios ou diferenciais claros."
   - NÃO invente benefícios como conforto, durabilidade, qualidade premium, desempenho ou custo-benefício.

7. TEXTO MELHORADO (improvedVersion) REESCRITA FIEL E SEM PLACEHOLDERS OU SEPARADORES VAZIOS:
   - Deve preservar TODOS os fatos do anúncio original sem inventar nada.
   - NUNCA inclua placeholders, rótulos vazios, colchetes ou separadores duplicados (como "- -", "--", "Tamanho: -", "Tamanho: ", "Modelo: ", "Cor: ", "Preço: ", "undefined", "null", "NaN", "[object Object]", "[informação ausente]", "[não informado]").
   - Se uma informação (como tamanho, modelo, cor, marca, medidas, etc.) NÃO foi fornecida no anúncio original, NUNCA inclua esse campo no texto nem tente inventar dados ou campos vazios. Simplesmente omita o campo e redija a frase de forma fluida, natural e profissional em português.
   - A identificação de informações faltantes pertence exclusivamente à seção de diagnóstico (classifiedMissingFields e missingFields), NUNCA à versão melhorada.
   - Corrija o português, organize os dados em tópicos, melhore o título e remova gírias.
   - NUNCA invente promoções, garantias, nota fiscal, frete ou estoque.
   - NUNCA invente urgência ou escassez ("últimas unidades", "corre").
   - CTAs seguras e neutras ("Entre em contato para saber mais.", "Chame no privado para mais informações.", "Fale comigo se tiver interesse.").

8. CLASSIFICAÇÃO RIGOROSA DAS INFORMAÇÕES NÃO FORNECIDAS (ESSENCIAL, RECOMENDÁVEL, OPCIONAL):
   - O Analisador deve diferenciar informações realmente necessárias de informações apenas recomendáveis ou opcionais.
   - NÃO trate automaticamente marca, modelo, cor, estado, acessórios ou outras informações como obrigatórias para todo produto.
   - NUNCA exija nota fiscal, garantia, estoque ou prazo de entrega para produtos comuns.
   - Para cada informação NÃO fornecida, classifique com rigor em classifiedMissingFields como:
     🔴 "essencial": Informação cuja ausência realmente impede o comprador de entender ou avaliar adequadamente o anúncio (ex: a identificação do próprio produto, tamanho/numeração para calçados/roupas, modelo exato para celular/veículo).
     🟡 "recomendavel": Informação que poderia melhorar a qualidade, confiança ou conversão do anúncio, mas cuja ausência NÃO torna o anúncio ruim por si só (ex: preço quando omisso, marca para produtos genéricos, estado de conservação, itens inclusos).
     🟢 "opcional": Informação que pode ser adicionada, mas não é importante para aquele anúncio específico (ex: cor de um fone de ouvido ou de um eletrônico simples, dimensões milimétricas).
   - A classificação DEVE depender do tipo de produto, do contexto e das informações já fornecidas.
   - Em missingFields: liste as pendências formatadas com prefixo do nível:
     "🔴 ESSENCIAL: [campo] - [motivo]"
     "🟡 RECOMENDÁVEL: [campo] - [motivo]"
     "🟢 OPCIONAL: [campo] - [motivo]"

9. EVITAR REPETIÇÃO:
   - Na lista de problemas ("issues"), NUNCA repita o mesmo problema. Cada problema deve aparecer apenas uma vez. Priorize os 3 a 5 mais importantes.
   - Recomendações devem estar diretamente alinhadas aos problemas apontados.

10. DIFERENCIAR FATO DE SUGESTÃO:
    - Ao fazer sugestões criativas nas recomendações, use sempre o tom condicional. NUNCA afirme benefícios como conforto, durabilidade, qualidade premium ou desempenho como verdades já garantidas.

11. CASOS DE REFERÊNCIA:
    • Teste A: "vendo camiseta nike 79 reais boa chama pv" -> Título fraco (20-35), dados presentes (camiseta, nike, 79 reais), dados mal apresentados ("chama pv", "boa"), faltam tamanho/cor/condição, nota geral muito ruim (20-40).
    • Teste B: "Camiseta Nike preta M nova por R$79. Retirada em São José dos Campos. Chame no direct." -> Informações completas (produto, marca, cor, tamanho, condição, preço, retirada, direct). Sem benefícios explícitos, nota bom (75-89).
    • Teste C: "vendo tênis" -> Título genérico, quase tudo ausente, nota muito ruim (20-40).
    • Teste D: "iPhone 13 128GB azul, bateria 90%, R$2.000, acompanha caixa e carregador." -> Modelo, capacidade, cor, bateria, preço e acessórios todos informados. NÃO pedir capacidade nem bateria! Nota bom (75-89).
    • Teste E: "Smartphone com apenas tela grande e boa câmera" -> Destaque apenas o que foi informado; não invente megapixels ou processador.
    • Teste F: "Creme hidratante hidrata a pele" -> 1 benefício apenas.
    • Teste G: "Produto resistente a respingos" -> NUNCA transformar em à prova d'água.
    • Teste H: "Produto seminovo, usado 2 vezes" -> NUNCA transformar em novo.
    • Teste I: "Produto em bom estado" -> NUNCA transformar em impecável.

12. AUTO-VERIFICAÇÃO INTERNA OBRIGATÓRIA (Antes de emitir o JSON):
    - "Estou chamando uma característica de benefício?" (Se sim, declare que não há benefícios reais informados).
    - "Estou inventando alguma vantagem que o vendedor não informou?" (Se sim, remova imediatamente).
    - "A nota geral realmente representa a qualidade do anúncio?" (20-40 muito ruim, 40-59 fraco, 60-74 razoável, 75-89 bom, 90-100 excelente).
`;

      const { response, modelUsed } = await generateWithResilience(client, {
        contents: prompt,
        config: {
          systemInstruction:
            "Você é o especialista sênior em copywriting do AnunciaAI. REGRA ABSOLUTA: O anúncio é a ÚNICA FONTE DE VERDADE. NUNCA invente características, especificações, garantias, nota fiscal, estoque ou benefícios. Preserve o significado original com fidelidade estrita (respingos NUNCA vira à prova d'água; seminovo/usado 2x NUNCA vira novo; em bom estado NUNCA vira impecável). Diferencie características de benefícios. Diferencie informações essenciais (🔴), recomendáveis (🟡) e opcionais (🟢). CTAs neutros e seguros.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Nota geral de 0 a 100 refletindo a qualidade geral real da copy" },
              scoreLabel: { type: Type.STRING, description: "Excelente (90-100), Bom (75-89), Razoável (60-74), Fraco (40-59) ou Muito Ruim (20-40)" },
              summary: { type: Type.STRING, description: "Resumo executivo do diagnóstico em 1 ou 2 frases" },
              detectedCategory: {
                type: Type.STRING,
                description: "Categoria identificada do produto (ex: Vestuário / Moda, Eletrônicos / Periféricos, etc.)",
              },
              detectedFields: {
                type: Type.ARRAY,
                description: "Informações que já estão presentes no anúncio analisado",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field: { type: Type.STRING, description: "Nome do campo (ex: Produto, Marca, Preço, Tamanho, etc.)" },
                    status: { type: Type.STRING, description: "'informado' ou 'mal_apresentado'" },
                    value: { type: Type.STRING, description: "Trecho ou valor identificado no texto" },
                    details: { type: Type.STRING, description: "Detalhes ou observação sobre o dado identificado" },
                  },
                  required: ["field", "status", "value"],
                },
              },
              poorlyPresentedFields: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Informações presentes no texto mas mal redigidas ou informais",
              },
              missingFields: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de informações ausentes formatadas com nível (🔴 ESSENCIAL, 🟡 RECOMENDÁVEL ou 🟢 OPCIONAL)",
              },
              classifiedMissingFields: {
                type: Type.ARRAY,
                description: "Classificação das informações ausentes em essencial, recomendavel ou opcional",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field: { type: Type.STRING, description: "Nome da informação não fornecida" },
                    level: { type: Type.STRING, description: "'essencial', 'recomendavel' ou 'opcional'" },
                    reason: { type: Type.STRING, description: "Justificativa da importância ou opcionalidade para este produto específico" },
                  },
                  required: ["field", "level", "reason"],
                },
              },
              criteriaBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criterion: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                  },
                  required: ["criterion", "score", "feedback"],
                },
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Pontos fortes do anúncio",
              },
              issues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Problemas encontrados",
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Recomendações específicas e acionáveis",
              },
              improvedVersion: {
                type: Type.STRING,
                description: "Versão melhorada do anúncio redigida em português natural e profissional, utilizando ESTRITAMENTE as informações fornecidas no anúncio original. NUNCA insira placeholders, campos vazios, separadores duplicados ou informações ausentes.",
              },
            },
            required: [
              "score",
              "scoreLabel",
              "summary",
              "detectedCategory",
              "detectedFields",
              "poorlyPresentedFields",
              "missingFields",
              "criteriaBreakdown",
              "strengths",
              "issues",
              "recommendations",
              "improvedVersion",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta vazia do modelo Gemini");
      }

      const parsed = cleanAndParseJSON(responseText);
      const sanitized = sanitizeAndValidateAnalysis(parsed, adText);
      adminMetrics.recordEvent({
        event: "ad_analyzed",
        eventId,
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
        score: sanitized.score,
        scoreLabel: sanitized.scoreLabel,
      });
      return res.json({ ...sanitized, eventId });
    } catch (error: any) {
      console.log("[Info] Acionando diagnóstico estruturado de segurança:", error?.message || error);
      try {
        const fallback = generateFallbackAnalysis(req.body.adText || "");
        const fallbackSanitized = sanitizeAndValidateAnalysis(fallback, req.body.adText || "");
        adminMetrics.recordEvent({
          event: "ad_analyzed",
          eventId,
          sessionId: typeof sessionId === "string" ? sessionId : undefined,
          score: fallbackSanitized.score,
          scoreLabel: fallbackSanitized.scoreLabel,
        });
        return res.json({ ...fallbackSanitized, eventId });
      } catch {
        return res.status(500).json({
          error: "Não foi possível analisar o anúncio no momento. Tente novamente.",
        });
      }
    }
  });

  // API Route for improving ads (protected by AI rate limiter)
  app.post("/api/improve-ad", aiRateLimitMiddleware, async (req, res) => {
    const sessionId = (req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const eventId = (req.body?.eventId || "imp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as string;

    try {
      if (sessionId && typeof sessionId === "string") {
        adminMetrics.recordSession(sessionId);
      }

      const { adText } = req.body;

      if (!adText || !String(adText).trim()) {
        return res.status(400).json({
          error: "Por favor, informe o texto do anúncio para melhorar.",
        });
      }

      const cleanOriginal = String(adText).trim();
      const client = getGeminiClient();

      if (!client) {
        console.log("[Info] GEMINI_API_KEY não configurada. Usando melhorador estruturado.");
        const fallback = generateFallbackImprovedAd(cleanOriginal);
        const sanitized = sanitizeImprovedAdText(fallback, cleanOriginal);
        return res.json({
          improvedText: sanitized,
          originalText: cleanOriginal,
          eventId,
        });
      }

      const prompt = `
Você é o especialista em copywriting e redação comercial do AnunciaAI.
Reescreva e melhore o seguinte anúncio de venda com base ESTRITAMENTE nas informações fornecidas no anúncio original:

"""
${cleanOriginal}
"""

REGRAS ABSOLUTAS:
1. O anúncio original é a ÚNICA FONTE DE VERDADE:
   - NUNCA invente características, especificações, medidas, tamanho, cor ou material não informados.
   - NUNCA invente garantia (ex: garantia de fábrica, 1 ano de garantia).
   - NUNCA invente nota fiscal (NF).
   - NUNCA invente estoque (ex: estoque limitado, últimas unidades).
   - NUNCA invente prazo de entrega, frete grátis ou envio imediato se não estiver no texto original.
   - NUNCA invente formas de pagamento, parcelamento ou descontos.
   - NUNCA invente urgência ou escassez ("corra", "aproveite já").

2. PRESERVAÇÃO RIGOROSA DO SIGNIFICADO:
   - "resistente a respingos" NUNCA pode virar "à prova d'água" ou "impermeável".
   - "seminovo", "usado", "usei 2x", "marcas de uso" NUNCA pode virar "novo", "lacrado" ou "sem uso".
   - "em bom estado" NUNCA pode virar "impecável".
   - Mantenha exatamente o estado e a condição real declarada.

3. ZERO PLACEHOLDERS E ZERO CAMPOS VAZIOS:
   - NUNCA insira colchetes ou placeholders como "[informe]", "[adicione]", "[tamanho]", "[campo]".
   - NUNCA deixe campos vazios como "Tamanho: -", "Material: ", "Preço: ". Se uma informação não existe, simplesmente NÃO cite o campo.
   - NUNCA use "undefined", "null", "NaN" ou qualquer termo técnico.

4. O QUE TRABALHAR:
   - Clareza da mensagem;
   - Organização (título objetivo, dados em tópicos quando apropriado, texto fluido);
   - Português brasileiro natural e profissional;
   - Retirar gírias sem afastar o comprador;
   - Chamada para ação acolhedora, neutra e segura.

Retorne um JSON com a chave "improvedText".
`;

      const { response } = await generateWithResilience(client, {
        contents: prompt,
        config: {
          systemInstruction:
            "Você é o especialista sênior em redação do AnunciaAI. REGRA ABSOLUTA: O texto original é a única fonte de verdade. NUNCA invente informações, materiais, garantias, nota fiscal, estoque ou benefícios. Preserve o significado estrito (respingos NUNCA vira à prova d'água; seminovo/usado NUNCA vira novo). NUNCA use placeholders ou colchetes. Retorne o texto melhorado limpo no campo 'improvedText'.",
          responseMimeType: "application/json",
          temperature: 0.2,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedText: {
                type: Type.STRING,
                description: "Texto do anúncio completamente melhorado, sem placeholders e sem invenções.",
              },
            },
            required: ["improvedText"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta vazia do modelo Gemini");
      }

      const parsed = cleanAndParseJSON(responseText);
      const rawImproved = parsed?.improvedText || parsed?.improvedVersion || "";
      const sanitized = sanitizeImprovedAdText(rawImproved, cleanOriginal);

      return res.json({
        improvedText: sanitized || generateFallbackImprovedAd(cleanOriginal),
        originalText: cleanOriginal,
        eventId,
      });
    } catch (error: any) {
      console.log("[Info] Acionando melhorador estruturado de segurança:", error?.message || error);
      try {
        const cleanOriginal = String(req.body?.adText || "").trim();
        const fallback = generateFallbackImprovedAd(cleanOriginal);
        const sanitized = sanitizeImprovedAdText(fallback, cleanOriginal);
        return res.json({
          improvedText: sanitized,
          originalText: cleanOriginal,
          eventId,
        });
      } catch {
        return res.status(500).json({
          error: "Não foi possível melhorar o anúncio no momento. Tente novamente.",
        });
      }
    }
  });

  // API Route for ad checklist (protected by AI rate limiter)
  app.post("/api/check-ad", aiRateLimitMiddleware, async (req, res) => {
    const sessionId = (req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const eventId = (req.body?.eventId || "chk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as string;

    try {
      if (sessionId && typeof sessionId === "string") {
        adminMetrics.recordSession(sessionId);
      }

      const { adText } = req.body;

      if (!adText || !adText.trim()) {
        return res.status(400).json({
          error: "Por favor, informe o texto do anúncio para análise do checklist.",
        });
      }

      const client = getGeminiClient();

      if (!client) {
        console.log("[Info] GEMINI_API_KEY não configurada. Usando checklist estruturado.");
        const fallback = generateFallbackChecklist(adText);
        const validated = sanitizeAndValidateChecklist(fallback, adText);
        return res.json({ ...validated, eventId });
      }

      const prompt = `
Você é o especialista do AnunciaAI responsável pelo Checklist Inteligente e Contextual de anúncios.
Analise criticamente a COMPLETUDE das informações no seguinte anúncio:

"""
${adText}
"""

SIGA RIGOROSAMENTE AS SEGUINTES DIRETRIZES:

1. PAGAMENTO (REQUISITO RESTRITIVO):
   - NÃO classifique automaticamente "formas de pagamento" como recomendado ou essencial.
   - Só sugerir formas de pagamento quando:
     a) o contexto do anúncio tornar isso claramente relevante (ex: menção a parcelamento, troca ou pagamento); ou
     b) a ausência dessa informação realmente dificultar a negociação.
   - Caso contrário, NÃO inclua formas de pagamento no checklist.

2. ENTREGA / RETIRADA (REQUISITO RESTRITIVO):
   - NÃO classifique automaticamente "local de entrega ou retirada" como recomendado.
   - Só sugerir quando o contexto do anúncio indicar venda presencial, entrega, retirada ou quando essa informação for realmente relevante para o tipo de anúncio (ex: móveis volumosos como sofás, mesas e armários que exigem transporte/desmontagem).
   - Em anúncios gerais de calçados, roupas, eletrônicos ou serviços onde não foi mencionada entrega/retirada, NÃO inclua essa informação automaticamente.

3. RECOMENDAÇÕES SEM AFIRMAÇÕES NÃO COMPROVADAS (NEUTRALIDADE OBRIGATÓRIA):
   - NUNCA afirmar que determinada informação é:
     • "a principal dúvida"
     • "o que mais vende"
     • "o que mais atrai compradores"
     • "o que aumenta as vendas"
   - Use SEMPRE justificativas estritamente objetivas e neutras.
   - Exemplo ERRADO: "Informe o tamanho do tênis, pois é a principal dúvida para este tipo de produto."
   - Exemplo CORRETO: "Informe o tamanho do tênis para que o comprador saiba se a numeração é adequada para ele."

4. MODELO ESPECÍFICO:
   - Para produtos em que o modelo pode variar significativamente, "modelo específico" pode ser recomendado.
   - NUNCA tratar modelo como essencial automaticamente.
   - Se o modelo já estiver especificado no texto (ex: "iPhone 13", "Air Force", etc.), NÃO marque como ausente!

5. FOTOS:
   - "Fotos reais do produto" normalmente deve ser Recommended ou Optional, e NUNCA Essential por padrão, a menos que o contexto do anúncio exija isso.

6. RECONHECER INFORMAÇÕES JÁ PRESENTES (detectedItems):
   - Reconheça linguagem natural e informal: "bom estado", "bem conservado", "seminovo", "usado poucas vezes", "novo", "usado" são estados válidos.
   - Reconheça "funcionando perfeitamente", "funciona tudo" como condição de funcionamento.
   - Reconheça "128GB", "256GB" como capacidade de armazenamento.
   - Reconheça "chama pv", "chama no WhatsApp", "direct" como formas de contato.
   - NUNCA marque como ausente qualquer informação que já esteja informada ou implícita no texto original!

7. PONTUAÇÃO DE COMPLETUDE REAL (completenessScore: 0 a 100):
   - O score deve representar a COMPLETUDE das informações relevantes encontradas no anúncio.
   - NÃO usar um score fixo para determinados tipos de produto.
   - O score deve variar conforme:
     • Informações essenciais presentes/ausentes (peso principal: ausência reduz ~18 a 20 pontos cada);
     • Informações recomendadas presentes/ausentes (peso moderado: ausência reduz ~3 a 5 pontos cada);
     • Informações opcionais presentes/ausentes (peso pequeno: ausência reduz ~1 ponto cada).
   - NÃO penalizar fortemente anúncios curtos quando eles já possuem as informações realmente necessárias (ex: se um anúncio de iPhone 13 128GB azul por R$2.000 já tem produto, modelo, armazenamento, cor, preço, estado usado, funcionamento perfeito e WhatsApp, sua completude é altíssima e o score deve ser de 90 a 95).
   - Forneça uma explicação curta, neutra e direta em "scoreExplanation".

8. RECOMENDAÇÕES PRIORITÁRIAS (recommendations):
   - No máximo 3 recomendações prioritárias, específicas, práticas e 100% neutras ("💡 Como melhorar").
   - NUNCA invente dados e não reescreva o anúncio.
`;

      const { response } = await generateWithResilience(client, {
        contents: prompt,
        config: {
          systemInstruction:
            "Você é o especialista em análise contextual do AnunciaAI. Avalie a COMPLETUDE objetiva das informações relevantes. Seja rigorosamente neutro, NUNCA use afirmações não comprovadas como 'principal dúvida' ou 'o que mais vende'. Não recomende pagamento ou entrega a menos que contextualmente justificado. Modelo e fotos NUNCA são essenciais por padrão. Anúncios concisos e completos devem receber notas altas (90+).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productIdentified: { type: Type.STRING },
              productCategory: { type: Type.STRING },
              completenessScore: { type: Type.INTEGER },
              scoreExplanation: { type: Type.STRING },
              detectedItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ["field"],
                },
              },
              missingItems: {
                type: Type.OBJECT,
                properties: {
                  essential: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  recommended: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  optional: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["essential", "recommended", "optional"],
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "productIdentified",
              "completenessScore",
              "scoreExplanation",
              "detectedItems",
              "missingItems",
              "recommendations",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta vazia do modelo Gemini");
      }

      const parsed = cleanAndParseJSON(responseText);
      const sanitized = sanitizeAndValidateChecklist(parsed, adText);
      return res.json({ ...sanitized, eventId });
    } catch (error: any) {
      console.log("[Info] Acionando checklist estruturado de contingência:", error?.message || error);
      try {
        const fallback = generateFallbackChecklist(req.body?.adText || "");
        const fallbackSanitized = sanitizeAndValidateChecklist(fallback, req.body?.adText || "");
        return res.json({ ...fallbackSanitized, eventId });
      } catch {
        return res.status(500).json({
          error: "Não foi possível analisar o checklist no momento. Tente novamente.",
        });
      }
    }
  });

  // API Route for Photo Quality and Visual Analysis (protected by AI rate limiter)
  app.post("/api/analyze-photo", aiRateLimitMiddleware, async (req, res) => {
    const sessionId = (req.body?.sessionId || req.headers["x-session-id"]) as string | undefined;
    const eventId = (req.body?.eventId || "pht_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9)) as string;

    try {
      if (sessionId && typeof sessionId === "string") {
        adminMetrics.recordSession(sessionId);
      }

      const { image, imageBase64, mimeType, fileName } = req.body;
      const rawImage = (image || imageBase64) as string | undefined;

      if (!rawImage || typeof rawImage !== "string" || !rawImage.trim()) {
        return res.status(400).json({
          error: "Envie uma imagem válida para realizar a análise.",
        });
      }

      let base64Data = rawImage.trim();
      let resolvedMimeType = typeof mimeType === "string" && mimeType.includes("/") ? mimeType : "image/jpeg";

      if (base64Data.startsWith("data:")) {
        const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          resolvedMimeType = matches[1];
          base64Data = matches[2];
        } else {
          const commaIdx = base64Data.indexOf(",");
          if (commaIdx !== -1) {
            base64Data = base64Data.substring(commaIdx + 1);
          }
        }
      }

      const client = getGeminiClient();

      if (!client) {
        console.log("[Info] GEMINI_API_KEY não configurada. Usando análise visual estruturada.");
        const fallback = generateFallbackPhotoAnalysis(fileName);
        const validated = sanitizeAndValidatePhotoAnalysis(fallback, eventId);
        return res.json({ ...validated, eventId });
      }

      const systemInstruction = `
Você é o Analista Técnico de Fotografia de Produtos do AnunciaAI.
Sua única responsabilidade é avaliar com rigor e precisão a QUALIDADE TÉCNICA E VISUAL DA FOTOGRAFIA do anúncio, auxiliando o vendedor a tirar fotos mais claras, nítidas e atraentes para compradores.

OBJETIVO CRÍTICO:
Diferenciar com precisão cirúrgica algo que REALMENTE foi observado na imagem de algo que apenas poderia estar acontecendo.

DIRETRIZES DE PRECISÃO VISUAL:

1. NÃO INVENTAR PROBLEMAS VISUAIS:
   - NUNCA afirme que existe sujeira, manchas, danos, defeitos, riscos, arranhões ou imperfeições se isso não estiver claramente visível na imagem.
   - ERRADO: "Limpe a superfície para remover sujeiras." (quando não existe sujeira claramente identificável).
   - CORRETO: "O fundo possui uma superfície visualmente texturizada. Um fundo mais uniforme poderia destacar melhor o produto."
   - Somente mencione sujeira ou resíduos se houver evidência visual direta e inquestionável.

2. PROIBIDO USAR EXPRESSÕES HIPOTÉTICAS OU ESPECULATIVAS ("EVENTUAIS", "POSSÍVEIS"):
   - NUNCA use termos como: "eventuais sujeiras", "possíveis manchas", "talvez esteja danificado", "caso haja avarias", "possíveis riscos".
   - A análise se baseia ESTRITAMENTE no que REALMENTE aparece na foto. Jamais crie recomendações preventivas baseadas em defeitos não observados.

3. TEXTO, MARCA E MODELO NA EMBALAGEM / PRODUTO:
   - Se houver texto claramente legível na embalagem ou no item, mencione que o texto está visível.
   - Diferencie rigorosamente: "Texto/marca visível na embalagem" de "Modelo confirmado do produto".
   - NÃO confirme autenticidade e NUNCA afirme que o produto é original, autêntico ou réplica.
   - NÃO deduza o modelo completo apenas por aparência exterior, a menos que o nome do modelo esteja nitidamente legível no texto impresso da foto.
   - Exemplo CORRETO: "A marca e o texto 'PRO SUPERLIGHT' estão visíveis na embalagem."
   - Exemplo a EVITAR: "O modelo do produto é X." (a menos que esteja explicitamente escrito no texto visível).

4. CAUSA OBSERVÁVEL OBRIGATÓRIA PARA CADA RECOMENDAÇÃO:
   - Toda recomendação deve ter uma causa visual identificável.
   - Antes de gerar qualquer recomendação, responda internamente: "Consigo apontar exatamente qual elemento visível desta foto motivou esta recomendação?"
   - Se a resposta for NÃO, NÃO GERE a recomendação.

5. QUALIDADE E RELEVÂNCIA DAS RECOMENDAÇÕES:
   - Foque estritamente em fatores que realmente prejudicam a apresentação comercial:
     * Mão ou dedos visíveis segurando a embalagem ou produto -> recomendar apoiar a caixa/produto sobre uma superfície plana e retirá-los da cena.
     * Reflexos fortes ou pontos cegos de luz dura sobre plásticos, telas ou caixas -> recomendar ajustar o ângulo ou usar iluminação difusa/indireta.
     * Fundo poluído (roupas, móveis fora de contexto, objetos concorrentes ou ambiente desorganizado) -> recomendar fundo neutro e uniforme.
     * Produto cortado nas bordas, enquadramento torto ou produto muito pequeno e distante -> recomendar reenquadramento.
     * Baixa nitidez, desfoque ou iluminação fraca -> recomendar aproximar luz suave e firmar o aparelho.
   - NUNCA crie problemas artificiais apenas para preencher a lista.

6. FOTOS BOAS (NÃO OBRIGAR MÚLTIPLOS PROBLEMAS):
   - Se a foto for boa, retorne apenas 1 melhoria pontual de refinamento, ou até 0 melhorias se a foto já estiver com excelente apresentação comercial.
   - NÃO é obrigatório apresentar 3 ou 4 problemas quando eles não existem.

7. PRODUTOS EM CAIXA / EMBALAGEM:
   - Verifique reflexos no plástico/lacre da embalagem.
   - Verifique se há mãos segurando a caixa.
   - Verifique a legibilidade dos textos impressos na caixa.
   - Não invente especificações técnicas nem afirme autenticidade.

8. A NOTA DA FOTO (0 A 100):
   - Avalia SOMENTE a qualidade da foto como imagem de anúncio (iluminação, foco, enquadramento, apresentação, fundo), jamais o produto, seu valor ou seu estado funcional interno.
`;

      const prompt = `Analise a fotografia do produto enviada com rigorosa precisão visual:
1. Nota da foto (0 a 100) baseada puramente na qualidade fotográfica da imagem de anúncio.
2. Indicadores visuais:
   - qualidade: 'Boa', 'Regular' ou 'Precisa melhorar'
   - iluminacao: 'Boa', 'Regular' ou 'Precisa melhorar'
   - enquadramento: 'Bom', 'Regular' ou 'Precisa melhorar'
   - visibilidade: 'Boa', 'Regular' ou 'Precisa melhorar'
   - fundo: 'Bom', 'Regular' ou 'Precisa melhorar'
3. Pontos positivos observados (1 a 4 observações reais sobre o que está nítido, visível ou bem iluminado na foto).
4. O que pode melhorar (0 a 3 pontos com prioridade 'Alta prioridade', 'Média prioridade' ou 'Baixa prioridade'):
   - Cada ponto DEVE ter causa visual concreta observada na imagem (ex: reflexo na embalagem, mão segurando, fundo poluído, corte).
   - Se a foto estiver boa, apresente apenas 1 ponto ou 0 pontos se não houver defeitos relevantes.
   - NUNCA invente sujeira, danos ou riscos se não estiverem claramente visíveis.
   - NUNCA use expressões especulativas como 'eventuais' ou 'possíveis'.
5. Ângulos ou fotos adicionais recomendadas (1 a 3 sugestões, ex: 'Foto com o produto fora da embalagem', 'Visão traseira das conexões').
6. Próximos passos / sugestões práticas (1 a 3 dicas objetivas).
7. Aviso neutro sobre a análise ser puramente fotográfica.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          score: {
            type: Type.INTEGER,
            description: "Nota da foto de 0 a 100 baseada na qualidade fotográfica",
          },
          indicators: {
            type: Type.OBJECT,
            properties: {
              qualidade: { type: Type.STRING },
              iluminacao: { type: Type.STRING },
              enquadramento: { type: Type.STRING },
              visibilidade: { type: Type.STRING },
              fundo: { type: Type.STRING },
            },
            required: ["qualidade", "iluminacao", "enquadramento", "visibilidade", "fundo"],
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Pontos positivos observados na foto",
          },
          improvements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                priority: { type: Type.STRING },
              },
              required: ["text", "priority"],
            },
            description: "Pontos de melhoria na fotografia",
          },
          recommendedAngles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Ângulos ou tomadas recomendadas",
          },
          nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Dicas práticas para refazer ou adicionar fotos",
          },
          observationWarning: {
            type: Type.STRING,
            description: "Nota de neutralidade informando que a nota avalia apenas a qualidade da imagem",
          },
        },
        required: [
          "score",
          "indicators",
          "strengths",
          "improvements",
          "recommendedAngles",
          "nextSteps",
        ],
      };

      try {
        const geminiResult = await generateWithResilience(client, {
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: resolvedMimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
          },
          timeoutMs: 14000,
          models: ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"],
        });

        const rawJson = cleanAndParseJSON(geminiResult.response.text);
        const validated = sanitizeAndValidatePhotoAnalysis(rawJson, eventId);
        return res.json({ ...validated, eventId });
      } catch (geminiError: any) {
        console.warn("[Gemini API] Falha ou timeout na análise visual:", geminiError?.message || geminiError);
        const fallback = generateFallbackPhotoAnalysis(fileName);
        const validated = sanitizeAndValidatePhotoAnalysis(fallback, eventId);
        return res.json({ ...validated, eventId });
      }
    } catch (err: any) {
      console.error("[API Error /api/analyze-photo]:", err);
      const fallback = generateFallbackPhotoAnalysis();
      const validated = sanitizeAndValidatePhotoAnalysis(fallback, eventId);
      return res.json({ ...validated, eventId });
    }
  });

  // Admin Authentication & Private Creator Dashboard Endpoints
  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = adminProtection.getClientIp(req);

      // 1. Check brute-force lockout for this IP
      if (adminProtection.isLocked(clientIp)) {
        return res.status(429).json({
          error: "Excesso de tentativas. Aguarde alguns minutos e tente novamente.",
        });
      }

      // 2. Check if CREATOR_ADMIN_KEY is configured in server environment
      if (!adminMetrics.isKeyConfigured()) {
        console.warn("[Admin Auth] Tentativa de login administrativo: acesso administrativo não configurado no servidor.");
        return res.status(503).json({
          error: "O acesso administrativo não está configurado.",
        });
      }

      const accessKey = req.body?.accessKey;
      const isValid = typeof accessKey === "string" && adminMetrics.verifyKey(accessKey);

      // Subtle constant delay to deter brute-force attempts
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (!isValid) {
        const failureResult = adminProtection.recordFailure(clientIp);
        if (failureResult.isLocked) {
          return res.status(429).json({
            error: "Excesso de tentativas. Aguarde alguns minutos e tente novamente.",
          });
        }

        return res.status(401).json({
          error: "Chave de acesso administrativa inválida. Acesso bloqueado.",
        });
      }

      // Successful authentication: clear failure count
      adminProtection.recordSuccess(clientIp);
      const token = adminMetrics.createSession();
      return res.json({
        success: true,
        token,
        message: "Sessão de administrador autorizada com sucesso.",
      });
    } catch {
      return res.status(500).json({ error: "Erro ao processar autenticação de administrador." });
    }
  });

  app.get("/api/admin/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token || !adminMetrics.validateToken(token)) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true });
  });

  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      adminMetrics.revokeToken(token);
    }
    return res.json({ success: true });
  });

  app.get("/api/admin/metrics", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token || !adminMetrics.validateToken(token)) {
      return res.status(401).json({
        error: "Acesso restrito. Esta área é exclusiva do criador/administrador do AnunciaAI.",
      });
    }

    const metrics = adminMetrics.getMetrics();
    return res.json(metrics);
  });

  // Healthcheck
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "AnunciaAI" });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AnunciaAI rodando em http://localhost:${PORT}`);
  });
}

startServer();
