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

    // Resposta fixa de teste, sem Azure
    return res.json({
      reply: `AGILIA (modo teste): recebi sua mensagem — "${message}". Integração front-end + backend está funcionando.`
    });

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
