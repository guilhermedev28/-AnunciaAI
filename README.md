# -AnunciaAI
Um SaaS completo de IA generativa contra alucinações de dados, arquitetado e desenvolvido por mim aos 13 anos.
# AnunciaAI 🚀 - SaaS Multimodal de Copywriting para Vendedores

AnunciaAI é uma plataforma completa (SaaS) desenvolvida para auxiliar pequenos lojistas, e-commerces e profissionais autônomos a criarem e auditarem anúncios de alta conversão para marketplaces e redes sociais (Mercado Livre, Shopee, Instagram, WhatsApp). 

O coração do software baseia-se no **Princípio de Fidelidade Estrita (Anti-Alucinação)**, garantindo que a inteligência artificial utilize única e exclusivamente as especificações técnicas reais informadas pelo vendedor, eliminando a criação de falsas promessas, prazos ou garantias fantasmas.

---

## 🧑‍💻 Sobre o Criador (Sobre Mim)

> **"A curiosidade e a lógica guiam a tecnologia, não as equações."**

Olá! Meu nome é [Seu Nome aqui] e eu **desenvolvi este projeto completo aos 13 anos de idade por puro entretenimento, curiosidade e paixão por inovação.** 

Eu sempre tive muita dificuldade com a matemática tradicional da escola, mas descobri que a revolução da inteligência artificial generativa opera através da **linguagem humana e do raciocínio lógico**. Utilizando Engenharia de Prompt Avançada combinada com desenvolvimento de software, eu arquitetei toda a interface, a lógica do servidor e os algoritmos de validação deste microsaas para resolver uma dor real do mercado.

---

## 🧰 Principais Funcionalidades

1. **Gerador Inteligente de Anúncios:** Cria copies completas divididas em títulos, descrição estruturada, tópicos de diferenciais e uma única chamada para ação (CTA) segura.
2. **Diagnóstico Profissional (0 a 100):** Avalia a copy atual do vendedor, gerando notas por critérios (Clareza, Título, Persuasão) e separando informações ausentes em categorias cruciais (*Essencial, Recomendável e Opcional*).
3. **Gerador Especialista de Títulos (SEO):** Formula até 10 opções de títulos otimizados para busca. Conta com filtros rígidos que proíbem terminantemente a inclusão de preços em títulos voltados ao Mercado Livre (Regra de Ouro do marketplace).
4. **Análise Fotográfica Visual:** Recebe imagens reais de produtos, analisa enquadramento, iluminação e qualidade, retornando feedbacks técnicos sem inventar problemas hipotéticos.
5. **Creator Dashboard Privado:** Um painel administrativo em tempo real com gráficos de crescimento diário e logs de telemetria anônima protegida.

---

## ⚙️ Arquitetura Técnica e Tecnologias

O projeto foi construído utilizando uma stack moderna, performática e tipada:

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (v4) e Motion para animações fluidas.
*   **Backend:** Node.js com Express estruturado para ambientes Cloud Run / Cloud SQL.
*   **Engine de IA:** Google GenAI SDK integrado nativamente com a API do Gemini.
*   **Resiliência & Failover:** Algoritmo customizado no backend que gerencia limites de cota (Erro 429) e faz failover automático em cascata entre os modelos candidatos (`gemini-3.1-flash-lite` -> `gemini-3.8-flash` -> `gemini-flash-latest`).
*   **Segurança:** Middleware de *Rate Limiting* por IP do cliente e barreira criptográfica contra brute-force para o login do administrador.
*   **Testes Automatizados:** Suíte de testes unitários automatizados executados via `tsx` para validar o comportamento de geração e os filtros de segurança anti-alucinação.

---

## 🚀 Como Executar o Projeto Localmente

1. Clone este repositório no seu computador.
2. Instale as dependências executando o comando no terminal:
   ```bash
   npm install
   ```
3. Configure a sua chave de API do Gemini no arquivo `.env` (conforme as instruções do `.env.example`).
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra o navegador no endereço indicado (geralmente `http://localhost:3000`).

---

## 📄 Licença

Este projeto foi desenvolvido para fins de estudo, portfólio pessoal e experimentação tecnológica. Sinta-se livre para explorar o código!
