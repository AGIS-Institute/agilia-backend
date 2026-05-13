// server.js – Backend AGILIA / AGIS
// Requisitos:
//   npm install express cors dotenv @azure/ai-projects @azure/identity

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// CONFIGURAÇÃO DO PROJETO
// =========================

// Endpoint FIXO do projeto (Fábrica da Microsoft)
const PROJECT_ENDPOINT =
  "https://agis-global-ia-resource.services.ai.azure.com/api/projects/agis_global_ia";

// ID FIXO do agente AGILIA (já confirmado)
const AGILIA_AGENT_ID = "asst_qII8PNGv2AO0Jtj1WFu8AlZR";

// Opção 1: usar DefaultAzureCredential (Managed Identity / dev com az login)
const credential = new DefaultAzureCredential();

// Cliente do projeto
const projectClient = new AIProjectClient(PROJECT_ENDPOINT, credential);

// =========================
// FUNÇÃO DE CONVERSA COM O AGENTE
// =========================

async function runAgiliaConversation(userMessage) {
  // Recupera o agente AGILIA
  const agent = await projectClient.agents.getAgent(AGILIA_AGENT_ID);

  // Cria thread
  const thread = await projectClient.agents.threads.create();

  // Cria mensagem do usuário
  await projectClient.agents.messages.create(thread.id, "user", userMessage);

  // Cria run
  let run = await projectClient.agents.runs.create(thread.id, agent.id);

  // Polling até terminar
  while (run.status === "queued" || run.status === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await projectClient.agents.runs.get(thread.id, run.id);
  }

  if (run.status === "failed") {
    console.error("Run failed:", run.lastError);
    throw new Error("AGILIA run failed");
  }

  // Lista mensagens em ordem crescente
  const messages = projectClient.agents.messages.list(thread.id, {
    order: "asc",
  });

  let lastAssistantMessage = "Sem resposta do agente.";

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

  return lastAssistantMessage;
}

// =========================
// ROTA /chat PARA O HOSTINGER
// =========================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Mensagem inválida." });
    }

    const reply = await runAgiliaConversation(message);
    return res.json({ reply });
  } catch (error) {
    console.error("Erro no /chat:", error);
    return res.status(500).json({ error: "Erro interno no servidor AGILIA." });
  }
});

// =========================
// HEALTHCHECK
// =========================

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "AGILIA-backend" });
});

// =========================
// INICIALIZAÇÃO DO SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AGILIA backend rodando na porta ${PORT}`);
});
