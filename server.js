// ============================================================
//  AGILIA — Backend Oficial do AGIS (Render + API Key)
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AIProjectClient } from "@azure/ai-projects";
import { AzureKeyCredential } from "@azure/core-auth";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIGURAÇÃO DO PROJETO AGIS / AGILIA
// ============================================================

const PROJECT_ENDPOINT =
  "https://agis-global-ia-resource.services.ai.azure.com/api/projects/agis_global_ia";

const AGILIA_AGENT_ID = "asst_qII8PNGv2AO0Jtj1WFu8AlZR";

// Autenticação via API Key (Render COMPATÍVEL)
const credential = new AzureKeyCredential(process.env.AZURE_API_KEY);

// Cliente do projeto
const projectClient = new AIProjectClient(PROJECT_ENDPOINT, credential);

// ============================================================
// FUNÇÃO PRINCIPAL — EXECUTA UMA CONVERSA COM O AGILIA
// ============================================================

async function runAgiliaConversation(userMessage) {
  const agent = await projectClient.agents.getAgent(AGILIA_AGENT_ID);

  const thread = await projectClient.agents.threads.create();

  await projectClient.agents.messages.create(thread.id, "user", userMessage);

  let run = await projectClient.agents.runs.create(thread.id, agent.id);

  while (run.status === "queued" || run.status === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await projectClient.agents.runs.get(thread.id, run.id);
  }

  if (run.status === "failed") {
    console.error("Run failed:", run.lastError);
    throw new Error("AGILIA run failed");
  }

  const messages = projectClient.agents.messages.list(thread.id, {
    order: "asc",
  });

  let lastAssistantMessage = "No response from AGILIA.";

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

// ============================================================
// ROTA /chat — USADA PELO HOSTINGER
// ============================================================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message." });
    }

    const reply = await runAgiliaConversation(message);

    return res.json({ reply });
  } catch (error) {
    console.error("Error in /chat:", error);
    return res.status(500).json({
      error: "Internal AGILIA server error.",
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
  console.log(`🚀 AGILIA backend running on port ${PORT}`);
});




