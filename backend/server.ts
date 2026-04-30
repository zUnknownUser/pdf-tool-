import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs";
import ILovePDFFile from "@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { PDFDocument, degrees, rgb } from "pdf-lib";

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});


dotenv.config();
const PORT = Number(process.env.PORT) || 3000;
const BASE_URL =
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const safeName = decodeURIComponent(file.originalname)
      .replace(/[^\w.-]/g, "_");

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

app.use("/files", express.static("uploads"));

const prompts: Record<string, string> = {
  summary: "Resuma este texto de forma clara, curta e objetiva.",
  explain: "Explique este conteúdo de forma simples, como se fosse para um estudante.",
  important: "Extraia os pontos mais importantes deste texto em tópicos.",
  questions: "Crie perguntas e respostas com base neste texto.",
};

function getILovePDFInstance() {
  return new ILovePDFApi(
    process.env.ILOVEPDF_PUBLIC_KEY!,
    process.env.ILOVEPDF_SECRET_KEY!
  );
}

async function processSimpleILovePDFTask(
  taskName: "compress" | "merge" | "split",
  filePaths: string[],
  options: any = {}
) {
  const instance = getILovePDFInstance();

  const task = instance.newTask(taskName);
  await task.start();

  for (const filePath of filePaths) {
    const file = new ILovePDFFile(filePath);
    await task.addFile(file);
  }

  await task.process(options);

  const data = await task.download();

  return Buffer.from(data);
}


async function processPDFWithILovePDF(
  taskName: "protect" | "unlock",
  filePath: string,
  password: string
) {
  const instance = getILovePDFInstance();

  const task = instance.newTask(taskName);

  console.log(`[ilovepdf] Iniciando task: ${taskName}`);
  await task.start();
  console.log(`[ilovepdf] Task iniciada`);

  const file = new ILovePDFFile(filePath);
  await task.addFile(file);
  console.log(`[ilovepdf] Arquivo adicionado`);

  await task.process({ password });
  console.log(`[ilovepdf] Processado`);

  const data = await task.download();
  console.log(`[ilovepdf] Download ok`);

  return Buffer.from(data);
}

app.post("/ai/pdf-tools", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Texto não enviado." });
    }

    const instruction = prompts[action] || prompts.summary;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
${instruction}

Texto:
${text}
      `,
    });

    return res.json({ result: response.text });
  } catch (error) {
    console.error("Erro Gemini:", error);
    return res.status(500).json({ error: "Erro ao processar IA com Gemini." });
  }
});

app.post("/pdf/protect", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/protect =======");

    const password = req.body.password;

    if (!password) {
      return res.status(400).json({ error: "Senha não enviada." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    console.log("Arquivo:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Tamanho MB:", (req.file.size / 1024 / 1024).toFixed(2));
    console.log("Path:", req.file.path);

    if (req.file.mimetype !== "application/pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const outputName = `protected-${Date.now()}.pdf`;
    const outputPath = path.join("uploads", outputName);

    console.log("Protegendo PDF...");
    const buffer = await processPDFWithILovePDF(
      "protect",
      req.file.path,
      password
    );

    fs.writeFileSync(outputPath, buffer);
    fs.unlinkSync(req.file.path);

    console.log("PDF protegido com sucesso:", outputName);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao proteger PDF:");

    if (error?.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: "Erro ao proteger PDF." });
  }
});

app.post(
  "/pdf/sign",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("======= NOVA REQUISIÇÃO /pdf/sign =======");

      const files = req.files as {
        file?: Express.Multer.File[];
        signature?: Express.Multer.File[];
      };

      const pdfFile = files.file?.[0];
      const signatureFile = files.signature?.[0];

      if (!pdfFile) {
        return res.status(400).json({ error: "PDF não enviado." });
      }

      if (!signatureFile) {
        return res.status(400).json({ error: "Assinatura não enviada." });
      }

      if (pdfFile.mimetype !== "application/pdf") {
        fs.unlinkSync(pdfFile.path);
        fs.unlinkSync(signatureFile.path);
        return res.status(400).json({ error: "O arquivo enviado não é PDF." });
      }

      const pageNumber = Number(req.body.page ?? 1);
      const x = Number(req.body.x ?? 350);
      const y = Number(req.body.y ?? 80);
      const width = Number(req.body.width ?? 160);
      const height = Number(req.body.height ?? 70);

      const pdfBytes = fs.readFileSync(pdfFile.path);
      const signatureBytes = fs.readFileSync(signatureFile.path);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      const pageIndex = Math.max(0, Math.min(pageNumber - 1, pages.length - 1));
      const page = pages[pageIndex];

      let signatureImage;

      if (signatureFile.mimetype === "image/png") {
        signatureImage = await pdfDoc.embedPng(signatureBytes);
      } else if (
        signatureFile.mimetype === "image/jpeg" ||
        signatureFile.mimetype === "image/jpg"
      ) {
        signatureImage = await pdfDoc.embedJpg(signatureBytes);
      } else {
        fs.unlinkSync(pdfFile.path);
        fs.unlinkSync(signatureFile.path);
        return res.status(400).json({
          error: "A assinatura precisa ser PNG ou JPG.",
        });
      }

      page.drawImage(signatureImage, {
        x,
        y,
        width,
        height,
      });

      const signedPdfBytes = await pdfDoc.save();

      const outputName = `signed-${Date.now()}.pdf`;
      const outputPath = path.join("uploads", outputName);

      fs.writeFileSync(outputPath, signedPdfBytes);

      fs.unlinkSync(pdfFile.path);
      fs.unlinkSync(signatureFile.path);

      return res.json({
        fileUrl: `${BASE_URL}/files/${outputName}`,
      });
    } catch (error) {
      console.error("Erro ao assinar PDF:", error);

      return res.status(500).json({
        error: "Erro ao assinar PDF.",
      });
    }
  }
);

app.post("/pdf/compress", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    if (req.file.mimetype !== "application/pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const buffer = await processSimpleILovePDFTask("compress", [req.file.path], {
      compression_level: "recommended",
    });

    const outputName = `compressed-${Date.now()}.pdf`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, buffer);
    fs.unlinkSync(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error) {
    console.error("Erro ao comprimir PDF:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: "Erro ao comprimir PDF." });
  }
});

app.post("/pdf/merge", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length < 2) {
      return res.status(400).json({ error: "Envie pelo menos 2 PDFs." });
    }

    for (const file of files) {
      if (file.mimetype !== "application/pdf") {
        files.forEach((f) => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });

        return res.status(400).json({ error: "Todos os arquivos precisam ser PDF." });
      }
    }

    const filePaths = files.map((file) => file.path);

    const buffer = await processSimpleILovePDFTask("merge", filePaths);

    const outputName = `merged-${Date.now()}.pdf`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, buffer);

    files.forEach((file) => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error) {
    console.error("Erro ao juntar PDFs:", error);

    const files = req.files as Express.Multer.File[] | undefined;

    files?.forEach((file) => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });

    return res.status(500).json({ error: "Erro ao juntar PDFs." });
  }
});

app.post("/pdf/split", upload.single("file"), async (req, res) => {
  try {
    const ranges = req.body.ranges;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    if (!ranges) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Intervalo de páginas não enviado." });
    }

    if (req.file.mimetype !== "application/pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const buffer = await processSimpleILovePDFTask("split", [req.file.path], {
      ranges,
    });

    const outputName = `split-${Date.now()}.zip`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, buffer);
    fs.unlinkSync(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error) {
    console.error("Erro ao dividir PDF:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: "Erro ao dividir PDF." });
  }
});

app.post("/pdf/watermark", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/watermark =======");

    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Texto da marca não enviado." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    if (req.file.mimetype !== "application/pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      page.drawText(String(text).trim(), {
        x: width / 4,
        y: height / 2,
        size: 40,
        opacity: 0.2,
        rotate: degrees(-30),
        color: rgb(0.3, 0.3, 0.3),
      });
    });

    const newBytes = await pdfDoc.save();

    const outputName = `watermark-${Date.now()}.pdf`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, newBytes);
    fs.unlinkSync(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (err) {
    console.error("Erro ao aplicar marca d'água:", err);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: "Erro ao aplicar marca d'água." });
  }
});

app.post("/pdf/sign-base64", express.json({ limit: "30mb" }), async (req, res) => {
  try {
    const { pdfBase64, signatureBase64, page, x, y, width, height } = req.body;

    if (!pdfBase64 || !signatureBase64) {
      return res.status(400).json({ error: "PDF ou assinatura não enviados." });
    }

    const pdfBytes = Buffer.from(pdfBase64, "base64");
    const sigBytes = Buffer.from(signatureBase64, "base64");

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    const pageIndex = Math.max(0, Math.min((page ?? 1) - 1, pages.length - 1));
    const pdfPage = pages[pageIndex];

    const signatureImage = await pdfDoc.embedPng(sigBytes);

    pdfPage.drawImage(signatureImage, {
      x: x ?? 350,
      y: y ?? 80,
      width: width ?? 160,
      height: height ?? 70,
    });

    const signedBytes = await pdfDoc.save();

    const outputName = `signed-${Date.now()}.pdf`;
    const outputPath = path.join("uploads", outputName);
    fs.writeFileSync(outputPath, signedBytes);

    return res.json({ fileUrl: `${BASE_URL}/files/${outputName}` });
  } catch (error) {
    console.error("Erro ao assinar PDF (base64):", error);
    return res.status(500).json({ error: "Erro ao assinar PDF." });
  }
});


app.post("/pdf/unlock", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/unlock =======");

    const password = req.body.password;

    if (!password) {
      return res.status(400).json({ error: "Senha do PDF não enviada." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    console.log("Arquivo:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Tamanho MB:", (req.file.size / 1024 / 1024).toFixed(2));
    console.log("Path:", req.file.path);

    if (req.file.mimetype !== "application/pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const outputName = `unlocked-${Date.now()}.pdf`;
    const outputPath = path.join("uploads", outputName);

    console.log("Desbloqueando PDF...");
    const buffer = await processPDFWithILovePDF(
      "unlock",
      req.file.path,
      password
    );

    fs.writeFileSync(outputPath, buffer);
    fs.unlinkSync(req.file.path);

    console.log("PDF desbloqueado com sucesso:", outputName);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao desbloquear PDF:");

    if (error?.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: "Erro ao desbloquear PDF." });
  }
});

app.get("/", (req, res) => {
  res.send("API OK");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  ;
});

const SELF_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : null;

if (SELF_URL) {
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/`);
      console.log("[keep-alive] ping ok");
    } catch (err) {
      console.warn("[keep-alive] ping falhou:", err);
    }
  }, 4 * 60 * 1000);
}