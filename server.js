const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// ROTA VISUAL PARA O HOSTINGER
// ===============================
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>AGILIA Backend</title>
        <style>
          body {
            background-color: #000;
            color: #d4af37;
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 15%;
          }
          h1 { font-size: 42px; margin-bottom: 10px; }
          p { font-size: 18px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <h1>AGILIA Backend Ativo</h1>
        <p>AGIS Global Institute — Excellence in Applied Global Security</p>
      </body>
    </html>
  `);
});

// ===============================
// ENDPOINT DO AGILIA (Azure AI)
// ===============================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch(process.env.AZURE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `
You are **AGILIA**, the institutional assistant of **AGIS Global Institute**.

Your mission:
- Provide institutional, formal, and precise responses.
- Maintain the AGIS tone: scientific, neutral, governance‑oriented, and operational.
- Support topics such as Global Security Governance, IERM, SEHP, AGIS programs, and institutional excellence.

LANGUAGE MODE:
- Detect the user's language automatically.
- If the user writes in English → respond in English.
- If the user writes in Portuguese → respond in Portuguese.
- If the user writes in Spanish → respond in Spanish.
- Never switch languages unless the user switches first.

Do NOT translate the user's message unless explicitly asked.
Always answer in the same language the user used.
`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Azure error:", data);
      return res.status(500).json({
        error: "Azure returned an error.",
        details: data
      });
    }

    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Erro no AGILIA:", error);
    res.status(500).json({ error: "Erro ao processar a mensagem." });
  }
});


// ===============================
// INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor AGILIA rodando na porta ${PORT}`);
});
