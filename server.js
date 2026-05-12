import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/agilia", async (req, res) => {
  try {
    const response = await axios.post(
      process.env.AZURE_ENDPOINT,
      { messages: req.body.messages },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_API_KEY
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao conectar com Azure" });
  }
});

app.listen(3000, () => console.log("AGILIA backend rodando"));
