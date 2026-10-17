import express from "express";
import OpenAI from "openai";

const app = express();

app.use(express.json({ limit: "20kb" }));

// Health check: confirm that the server is running
app.get("/", (req, res) => {
  res.json({
    app: "iFixxy",
    status: "Backend is running"
  });
});

// AI troubleshooting endpoint
app.post("/api/diagnose", async (req, res) => {
  try {
    const { problem, category } = req.body ?? {};

    if (
      typeof problem !== "string" ||
      problem.trim().length === 0 ||
      problem.length > 3000
    ) {
      return res.status(400).json({
        error: "Please describe your problem in 1–3000 characters."
      });
    }

    if (!["hardware", "software"].includes(category)) {
      return res.status(400).json({
        error: "Category must be hardware or software."
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "AI service is not configured."
      });
    }

    const openai = new OpenAI({
      apiKey: apiKey
    });

    const result = await openai.responses.create({
      model: "gpt-5.5",
      instructions:
        "You are iFixxy, a helpful technology troubleshooting assistant. " +
        "Give simple, clear, numbered troubleshooting steps. " +
        "Ask for more details if needed. Never ask users to open devices " +
        "or handle dangerous internal components. If a device is smoking, " +
        "swollen, or dangerously hot, tell the user to stop using it " +
        "and seek qualified assistance.",
      input:
        "Category: " + category +
        "\nUser's problem: " + problem.trim()
    });

    return res.json({
      solution: result.output_text
    });

  } catch (error) {
    console.error(
      "OpenAI request failed:",
      error.status || "unknown status"
    );

    return res.status(500).json({
      error: "Unable to get a solution right now. Please try again."
    });
  }
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("iFixxy backend running on port " + PORT);
});
