# AnunciaAI

**Criação, análise e otimização de anúncios com inteligência artificial.**

O AnunciaAI é uma aplicação desenvolvida para ajudar vendedores a criar anúncios mais claros, profissionais e adequados a diferentes plataformas de venda.

🌐 **Aplicação:** [Acessar AnunciaAI](https://ai.studio/apps/08d5c377-c0f7-4580-8e81-6835ab84bb7e)

## Funcionalidades

- **Criador de anúncios:** gera títulos, descrições, benefícios e chamadas para ação.
- **Analisador de anúncios:** avalia a qualidade e identifica oportunidades de melhoria.
- **Melhorar anúncio:** transforma textos informais em anúncios mais organizados.
- **Análise de imagens:** ferramentas de análise de fotos de produtos.
- **Checklist:** auxilia na revisão de anúncios.
- **Gerador de títulos:** cria sugestões de títulos para diferentes plataformas.
- **Painel administrativo:** acompanha métricas e atividades da aplicação.

## Tecnologias

- React 19
- TypeScript
- Vite
- Node.js
- Express
- Google GenAI
- Tailwind CSS
- Recharts

## Qualidade e testes

O projeto possui testes automatizados voltados à geração e melhoria de anúncios.

**Última validação local:**
- 16 testes automatizados aprovados.
- Build de produção concluído.
- Testes de prevenção contra informações inventadas.
- Validação de preservação das características fornecidas pelo usuário.

## Executar localmente

**Requisitos:** Node.js e npm.

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente em um arquivo `.env` na raiz do projeto:

```env
GEMINI_API_KEY=sua_chave_google_genai
CREATOR_ADMIN_KEY=sua_chave_administrativa
```

Nunca compartilhe essas chaves ou envie o arquivo `.env` ao GitHub.

4. Inicie o projeto:

```bash
npm run dev
```

## Testes e produção

Executar os testes:

```bash
npm test
```

Gerar a versão de produção:

```bash
npm run build
```

Iniciar o servidor compilado:

```bash
npm start
```

## Objetivo do projeto

O AnunciaAI busca tornar a criação e a otimização de anúncios mais simples, acessíveis e confiáveis, com atenção especial à preservação das informações reais dos produtos.

---

**AnunciaAI — anúncios melhores, com inteligência artificial.**