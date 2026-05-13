// ============================================================
//  AGILIA — Backend Oficial do AGIS
//  server.js — Versão completa, otimizada e pronta para produção
// ============================================================

// Dependências:
// npm install express cors dotenv @azure/ai-projects @azure/identity

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIGURAÇÃO DO PROJETO AGIS / AGILIA
// ============================================================

// Endpoint FIXO do projeto (Azure AI Studio)
const PROJECT_ENDPOINT =
  "https://agis-global-ia-resource.services.ai.azure.com/api/projects/agis_global_ia";

// ID do agente AGILIA (confirmado)
const AGILIA_AGENT_ID = "asst_qII8PNGv2AO0Jtj1WFu8AlZR";

// Autenticação via Azure Identity
const credential = new DefaultAzureCredential();

// Cliente do projeto
const projectClient = new AIProjectClient(PROJECT_ENDPOINT, credential);

// ============================================================
// FUNÇÃO PRINCIPAL — EXECUTA UMA CONVERSA COM O AGILIA
// ============================================================

async function runAgiliaConversation(userMessage) {
  console.log("🔎 Recuperando agente AGILIA…");

  const agent = await projectClient.agents.getAgent(AGILIA_AGENT_ID);

  console.log(`🤖 Agente carregado: ${agent.name}`);

  // Criar thread
  const thread = await projectClient.agents.threads.create();
  console.log(`🧵 Thread criada: ${thread.id}`);

  // Criar mensagem do usuário
  await projectClient.agents.messages.create(thread.id, "user", userMessage);
  console.log(`📨 Mensagem enviada: "${userMessage}"`);

  // Criar run
  let run = await projectClient.agents.runs.create(thread.id, agent.id);
  console.log(`⚙️ Run iniciado: ${run.id}`);

  // Polling até finalizar
  while (run.status === "queued" || run.status === "in_progress") {
    console.log(`⏳ Status: ${run.status}… aguardando…`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await projectClient.agents.runs.get(thread.id, run.id);
  }

  if (run.status === "failed") {
    console.error("❌ Run falhou:", run.lastError);
    throw new Error("Falha ao processar resposta do AGILIA.");
  }

  console.log(`✅ Run concluído com status: ${run.status}`);

  // Recuperar mensagens
  const messages = projectClient.agents.messages.list(thread.id, {
    order: "asc",
  });

  let lastAssistantMessage = "Nenhuma resposta recebida.";

  for await (const m of messages) {
    if (m.role === "assistant") {
      const content = m.content.find(
        (c) => c.type === "text" && "text" in c
      );
      if (content) {
        lastAssistantMessage = content.text.value;
      }
    }
  }

  console.log("💬 Resposta do AGILIA:", lastAssistantMessage);

  return lastAssistantMessage;
}

// ============================================================
// ROTA /chat — USADA PELO HOSTINGER
// ============================================================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Mensagem inválida." });
    }

    console.log("📥 Mensagem recebida do frontend:", message);

    const reply = await runAgiliaConversation(message);

    return res.json({ reply });
  } catch (error) {
    console.error("🔥 Erro no endpoint /chat:", error);
    return res.status(500).json({
      error: "Erro interno no servidor AGILIA.",
      details: error.message,
    });
  }
});

// ============================================================
// HEALTHCHECK
// ============================================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AGILIA-backend",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AGILIA backend rodando na porta ${PORT}`);
});
