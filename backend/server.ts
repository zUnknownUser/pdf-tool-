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

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: "80mb" }));

app.use("/files", express.static(uploadDir));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = decodeURIComponent(file.originalname || "arquivo.pdf")
      .replace(/[^\w.-]/g, "_");

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 80 * 1024 * 1024,
  },
});

const prompts: Record<string, string> = {
  summary: "Resuma este texto de forma clara, curta e objetiva.",
  explain: "Explique este conteúdo de forma simples, como se fosse para um estudante.",
  important: "Extraia os pontos mais importantes deste texto em tópicos.",
  questions: "Crie perguntas e respostas com base neste texto.",
};

function withTimeout<T>(promise: Promise<T>, ms = 60000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout no processamento")), ms)
    ),
  ]);
}

function cleanupFile(filePath?: string) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("[cleanupFile] Falha ao apagar arquivo:", err);
  }
}

function getILovePDFInstance() {
  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  const secretKey = process.env.ILOVEPDF_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error("Chaves ILOVEPDF_PUBLIC_KEY ou ILOVEPDF_SECRET_KEY não configuradas.");
  }

  return new ILovePDFApi(publicKey, secretKey);
}

async function processSimpleILovePDFTask(
  taskName: "compress" | "merge" | "split",
  filePaths: string[],
  options: any = {}
) {
  const instance = getILovePDFInstance();
  const task = instance.newTask(taskName);

  console.log(`[ilovepdf] Iniciando task simples: ${taskName}`);
  await withTimeout(task.start());
  console.log("[ilovepdf] Task simples iniciada");

  for (const filePath of filePaths) {
    const file = new ILovePDFFile(filePath);
    await withTimeout(task.addFile(file));
    console.log("[ilovepdf] Arquivo adicionado:", filePath);
  }

  await withTimeout(task.process(options));
  console.log("[ilovepdf] Task simples processada");

  const data = await withTimeout(task.download());
  console.log("[ilovepdf] Download simples ok");

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
  await withTimeout(task.start());
  console.log("[ilovepdf] Task iniciada");

  const file = new ILovePDFFile(filePath);
  await withTimeout(task.addFile(file));
  console.log("[ilovepdf] Arquivo adicionado");

  await withTimeout(task.process({ password }));
  console.log("[ilovepdf] Processado");

  const data = await withTimeout(task.download());
  console.log("[ilovepdf] Download ok");

  return Buffer.from(data);
}

app.get("/", (req, res) => {
  res.send("API OK");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API saudável" });
});

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
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    return res.status(500).json({
      error: "Erro ao processar IA com Gemini.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/protect", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/protect =======");

    const password = req.body.password;

    if (!password) {
      cleanupFile(req.file?.path);
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
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const outputName = `protected-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    console.log("Protegendo PDF...");
    const buffer = await processPDFWithILovePDF("protect", req.file.path, password);

    fs.writeFileSync(outputPath, buffer);
    cleanupFile(req.file.path);

    console.log("PDF protegido com sucesso:", outputName);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao proteger PDF:", error?.message ?? error);

    if (error?.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    cleanupFile(req.file?.path);

    return res.status(500).json({
      error: "Erro ao proteger PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/unlock", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/unlock =======");

    const password = req.body.password;

    if (!password) {
      cleanupFile(req.file?.path);
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
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const outputName = `unlocked-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    console.log("Desbloqueando PDF...");
    const buffer = await processPDFWithILovePDF("unlock", req.file.path, password);

    fs.writeFileSync(outputPath, buffer);
    cleanupFile(req.file.path);

    console.log("PDF desbloqueado com sucesso:", outputName);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao desbloquear PDF:", error?.message ?? error);

    if (error?.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    cleanupFile(req.file?.path);

    return res.status(500).json({
      error: "Erro ao desbloquear PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/watermark", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/watermark =======");

    const { text } = req.body;

    if (!text || !String(text).trim()) {
      cleanupFile(req.file?.path);
      return res.status(400).json({ error: "Texto da marca não enviado." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    console.log("Arquivo:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Tamanho MB:", (req.file.size / 1024 / 1024).toFixed(2));
    console.log("Path:", req.file.path);

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    pdfDoc.getPages().forEach((page) => {
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

    const outputName = `watermark-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    fs.writeFileSync(outputPath, await pdfDoc.save());
    cleanupFile(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao aplicar marca d'água:", error?.message ?? error);
    cleanupFile(req.file?.path);

    return res.status(500).json({
      error: "Erro ao aplicar marca d'água.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post(
  "/pdf/sign",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    let pdfFile: Express.Multer.File | undefined;
    let signatureFile: Express.Multer.File | undefined;

    try {
      console.log("======= NOVA REQUISIÇÃO /pdf/sign =======");

      const files = req.files as {
        file?: Express.Multer.File[];
        signature?: Express.Multer.File[];
      };

      pdfFile = files.file?.[0];
      signatureFile = files.signature?.[0];

      if (!pdfFile) {
        cleanupFile(signatureFile?.path);
        return res.status(400).json({ error: "PDF não enviado." });
      }

      if (!signatureFile) {
        cleanupFile(pdfFile.path);
        return res.status(400).json({ error: "Assinatura não enviada." });
      }

      console.log("PDF:", pdfFile.originalname, pdfFile.mimetype, pdfFile.size);
      console.log("Assinatura:", signatureFile.originalname, signatureFile.mimetype, signatureFile.size);

      if (pdfFile.mimetype !== "application/pdf") {
        cleanupFile(pdfFile.path);
        cleanupFile(signatureFile.path);
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
        cleanupFile(pdfFile.path);
        cleanupFile(signatureFile.path);
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
      const outputPath = path.join(uploadDir, outputName);

      fs.writeFileSync(outputPath, signedPdfBytes);

      cleanupFile(pdfFile.path);
      cleanupFile(signatureFile.path);

      return res.json({
        fileUrl: `${BASE_URL}/files/${outputName}`,
      });
    } catch (error: any) {
      console.error("Erro ao assinar PDF:", error?.message ?? error);

      cleanupFile(pdfFile?.path);
      cleanupFile(signatureFile?.path);

      return res.status(500).json({
        error: "Erro ao assinar PDF.",
        detail: error?.message ?? String(error),
      });
    }
  }
);

app.post("/pdf/compress", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/compress =======");

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const level = req.body.compression_level ?? "recommended";

    const buffer = await processSimpleILovePDFTask("compress", [req.file.path], {
      compression_level: level,
    });
    
    const outputName = `compressed-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    fs.writeFileSync(outputPath, buffer);
    cleanupFile(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao comprimir PDF:", error?.message ?? error);
    cleanupFile(req.file?.path);

    return res.status(500).json({
      error: "Erro ao comprimir PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/pdf-to-word =======");

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

   const buffer = await processSimpleILovePDFTask("pdfoffice" as any, [req.file.path], {
  output_format: "docx",
});

    const outputName = `word-${Date.now()}.docx`;
    const outputPath = path.join(uploadDir, outputName);

    fs.writeFileSync(outputPath, buffer);
    cleanupFile(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao converter PDF para Word:", error?.message ?? error);
    cleanupFile(req.file?.path);

    return res.status(500).json({
      error: "Erro ao converter PDF para Word.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/merge", upload.array("files", 10), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/merge =======");

    if (!files || files.length < 2) {
      return res.status(400).json({ error: "Envie pelo menos 2 PDFs." });
    }

    for (const file of files) {
      if (file.mimetype !== "application/pdf") {
        files.forEach((f) => cleanupFile(f.path));
        return res.status(400).json({ error: "Todos os arquivos precisam ser PDF." });
      }
    }

    const filePaths = files.map((file) => file.path);
    const buffer = await processSimpleILovePDFTask("merge", filePaths);

    const outputName = `merged-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    fs.writeFileSync(outputPath, buffer);
    files.forEach((file) => cleanupFile(file.path));

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao juntar PDFs:", error?.message ?? error);
    files?.forEach((file) => cleanupFile(file.path));

    return res.status(500).json({
      error: "Erro ao juntar PDFs.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/split", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/split =======");

    const ranges = req.body.ranges;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    if (!ranges) {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "Intervalo de páginas não enviado." });
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: "O arquivo enviado não é um PDF." });
    }

    const buffer = await processSimpleILovePDFTask("split", [req.file.path], {
      ranges,
    });

    const outputName = `split-${Date.now()}.zip`;
    const outputPath = path.join(uploadDir, outputName);

    fs.writeFileSync(outputPath, buffer);
    cleanupFile(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao dividir PDF:", error?.message ?? error);
    cleanupFile(req.file?.path);

    return res.status(500).json({
      error: "Erro ao dividir PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/protect-base64", express.json({ limit: "80mb" }), async (req, res) => {
  let inputPath = "";

  try {
    const { pdfBase64, password } = req.body;

    if (!pdfBase64 || !password) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const inputName = `input-${Date.now()}.pdf`;
    inputPath = path.join(uploadDir, inputName);

    fs.writeFileSync(inputPath, Buffer.from(pdfBase64, "base64"));

    const buffer = await processPDFWithILovePDF("protect", inputPath, password);
    cleanupFile(inputPath);

    const outputName = `protected-${Date.now()}.pdf`;
    fs.writeFileSync(path.join(uploadDir, outputName), buffer);

    return res.json({ fileUrl: `${BASE_URL}/files/${outputName}` });
  } catch (error: any) {
    console.error("Erro protect-base64:", error?.message ?? error);
    cleanupFile(inputPath);

    return res.status(500).json({
      error: "Erro ao proteger PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/unlock-base64", express.json({ limit: "80mb" }), async (req, res) => {
  let inputPath = "";

  try {
    const { pdfBase64, password } = req.body;

    if (!pdfBase64 || !password) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const inputName = `input-${Date.now()}.pdf`;
    inputPath = path.join(uploadDir, inputName);

    fs.writeFileSync(inputPath, Buffer.from(pdfBase64, "base64"));

    const buffer = await processPDFWithILovePDF("unlock", inputPath, password);
    cleanupFile(inputPath);

    const outputName = `unlocked-${Date.now()}.pdf`;
    fs.writeFileSync(path.join(uploadDir, outputName), buffer);

    return res.json({ fileUrl: `${BASE_URL}/files/${outputName}` });
  } catch (error: any) {
    console.error("Erro unlock-base64:", error?.message ?? error);
    cleanupFile(inputPath);

    return res.status(500).json({
      error: "Erro ao desbloquear PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/watermark-base64", express.json({ limit: "80mb" }), async (req, res) => {
  try {
    const { pdfBase64, text } = req.body;

    if (!pdfBase64 || !text) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const pdfBytes = Buffer.from(pdfBase64, "base64");
    const pdfDoc = await PDFDocument.load(pdfBytes);

    pdfDoc.getPages().forEach((page) => {
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

    const outputName = `watermark-${Date.now()}.pdf`;
    fs.writeFileSync(path.join(uploadDir, outputName), await pdfDoc.save());

    return res.json({ fileUrl: `${BASE_URL}/files/${outputName}` });
  } catch (error: any) {
    console.error("Erro watermark-base64:", error?.message ?? error);

    return res.status(500).json({
      error: "Erro ao aplicar marca d'água.",
      detail: error?.message ?? String(error),
    });
  }
});

app.post("/pdf/sign-base64", express.json({ limit: "80mb" }), async (req, res) => {
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

    const outputName = `signed-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    fs.writeFileSync(outputPath, await pdfDoc.save());

    return res.json({ fileUrl: `${BASE_URL}/files/${outputName}` });
  } catch (error: any) {
    console.error("Erro ao assinar PDF (base64):", error?.message ?? error);

    return res.status(500).json({
      error: "Erro ao assinar PDF.",
      detail: error?.message ?? String(error),
    });
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("[ERRO GLOBAL]", err);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "Arquivo muito grande.",
      detail: "O limite atual foi excedido.",
    });
  }

  return res.status(500).json({
    error: "Erro interno no servidor.",
    detail: err?.message ?? String(err),
  });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`Upload dir: ${uploadDir}`);
});

server.on("error", (err) => {
  console.error("[SERVER ERROR]", err);
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
