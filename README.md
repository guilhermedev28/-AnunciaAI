# AnunciaAI

**Criação, análise e otimização de anúncios com inteligência artificial.**

O AnunciaAI é um projeto de software desenvolvido para ajudar vendedores, pequenos lojistas e profissionais autônomos a preparar anúncios mais claros, completos e adequados a diferentes canais de venda.

<p align="center">
  <a href="https://ai.studio/apps/08d5c377-c0f7-4580-8e81-6835ab84bb7e"><strong>🚀 Experimentar o AnunciaAI</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/guilhermedev28/-AnunciaAI/tree/anunciaai-source"><strong>Ver código-fonte</strong></a>
</p>

---

## ✨ Funcionalidades

- **Criador de anúncios:** gera títulos, descrições, benefícios e chamadas para ação a partir das informações fornecidas pelo vendedor.
- **Analisador de anúncios:** avalia o texto e aponta oportunidades de melhoria.
- **Melhoria de anúncios:** ajuda a reorganizar e aprimorar textos existentes.
- **Gerador de títulos:** cria sugestões adaptadas a canais como Instagram, WhatsApp, Mercado Livre, Shopee e TikTok.
- **Análise de fotos:** recebe imagens de produtos e oferece observações sobre aspectos visuais, como iluminação e enquadramento.
- **Checklist de anúncios:** ajuda a revisar informações e pontos importantes antes da publicação.
- **Painel administrativo:** área privada com métricas e atividades da aplicação.

## 🛡️ Fidelidade às informações fornecidas

Uma das principais preocupações do projeto é reduzir informações inventadas pela IA.

As rotinas de geração e validação foram desenvolvidas para priorizar os dados enviados pelo usuário e evitar acrescentar características, garantias ou especificações que não foram informadas. O projeto também possui testes automatizados para verificar regras de geração e melhoria de anúncios.

> A IA pode cometer erros; por isso, o conteúdo gerado deve ser revisado antes de ser publicado.

## 🧰 Tecnologias

| Camada | Tecnologias |
|---|---|
| Interface | React 19, TypeScript |
| Build e desenvolvimento | Vite |
| Estilização | Tailwind CSS |
| Backend | Node.js, Express |
| Inteligência artificial | Google GenAI SDK e Gemini |
| Visualização de dados | Recharts |
| Testes | TypeScript e tsx |

## 🏗️ Arquitetura e confiabilidade

- Aplicação organizada em componentes React e módulos de lógica separados.
- Backend Express com rotas específicas para geração, análise, melhoria, títulos, checklist e análise de imagens.
- Estratégia de seleção e tentativa sequencial de modelos Gemini no backend.
- Respostas alternativas e validações para alguns fluxos quando a API está indisponível.
- Middleware de limitação de requisições.
- Proteção adicional para autenticação do painel administrativo.

Essas medidas ajudam na organização e resiliência da aplicação, mas não representam uma garantia de disponibilidade ou de segurança absoluta.

## 🧪 Testes e validação

Na validação local registrada durante o desenvolvimento:

- **16 testes automatizados aprovados** nas suítes de geração e melhoria de anúncios.
- **Build de produção concluído** com sucesso.
- Testes voltados à preservação das informações fornecidas e à prevenção de características não informadas.

## 👨‍💻 Sobre o desenvolvimento

O AnunciaAI foi desenvolvido por **Guilherme, aos 13 anos**, como um projeto independente de aprendizado e experimentação em inteligência artificial e desenvolvimento de software.

O processo foi iterativo: segundo o histórico do projeto, foram realizadas **mais de 30 versões e ciclos de ajustes**, incluindo melhorias na interface, nos fluxos de geração, nas validações e no comportamento das respostas da IA.

O objetivo foi transformar uma ideia em uma aplicação funcional, aprendendo na prática sobre frontend, backend, integração com APIs, testes e engenharia de prompts.

## ▶️ Executar localmente

**Requisitos:** Node.js e npm.

1. Clone o repositório e entre na pasta do projeto.
2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz e configure as variáveis necessárias, usando `.env.example` como referência:

```env
GEMINI_API_KEY=sua_chave_google_genai
CREATOR_ADMIN_KEY=sua_chave_administrativa
```

4. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Outros comandos disponíveis:

```bash
npm test
npm run build
npm start
```

**Importante:** nunca publique seu arquivo `.env`, chaves de API ou credenciais. O arquivo `.env.example` contém apenas os nomes das variáveis.

## 🔗 Links

- **Aplicação:** https://ai.studio/apps/08d5c377-c0f7-4580-8e81-6835ab84bb7e
- **Código-fonte:** https://github.com/guilhermedev28/-AnunciaAI/tree/anunciaai-source
- **Desenvolvedor:** https://github.com/guilhermedev28

---

*AnunciaAI — anúncios melhores, com inteligência artificial.*
