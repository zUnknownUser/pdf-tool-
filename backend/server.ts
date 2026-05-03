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

type ApiErrorCode =
  | "NO_FILE_SELECTED"
  | "INVALID_FILE"
  | "INVALID_PDF"
  | "PDF_PROTECTED"
  | "PDF_PASSWORD_REQUIRED"
  | "PDF_WRONG_PASSWORD"
  | "PDF_CORRUPTED"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "MIN_FILES_REQUIRED"
  | "INVALID_PAGE_RANGE"
  | "SERVER_ERROR"
  | "API_UNAVAILABLE"
  | "UPLOAD_FAILED"
  | "BACKEND_FILE_URL_MISSING"
  | "PASSWORD_REQUIRED"
  | "WATERMARK_TEXT_REQUIRED"
  | "SIGNATURE_REQUIRED"
  | "UNKNOWN_ERROR";

function sendApiError(
  res: any,
  status: number,
  code: ApiErrorCode,
  error: string,
  detail?: string
) {
  return res.status(status).json({
    code,
    error,
    detail: detail ?? "",
  });
}

function getErrorDetail(error: any) {
  return error?.message || String(error) || "Erro desconhecido.";
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

app.post("/pdf/rotate", upload.single("file"), async (req, res) => {
  try {
    const rotation = Number(req.body.rotation ?? 90);

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotation) % 360));
    });

    const outputName = `rotated-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    const rotatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, rotatedPdfBytes);

    cleanupFile(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao rotacionar PDF:", error);

    cleanupFile(req.file?.path);

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao rotacionar PDF.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/remove-pages", upload.single("file"), async (req, res) => {
  try {
    const ranges = String(req.body.ranges ?? "").trim();

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (!ranges) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PAGE_RANGE",
        "Páginas não informadas.",
        "Digite as páginas que deseja remover. Exemplo: 2, 4-6 ou 1-3, 8."
      );
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
    }

    const pdfBytes = fs.readFileSync(req.file.path);
    const originalPdf = await PDFDocument.load(pdfBytes);

    const totalPages = originalPdf.getPageCount();

    const pagesToRemove = new Set<number>();

    const parts = ranges
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startRaw, endRaw] = part.split("-");
        const start = Number(startRaw);
        const end = Number(endRaw);

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 1 ||
          end < start ||
          end > totalPages
        ) {
          cleanupFile(req.file.path);

          return sendApiError(
            res,
            400,
            "INVALID_PAGE_RANGE",
            "Intervalo inválido.",
            `Intervalo inválido: ${part}. O PDF tem ${totalPages} página(s).`
          );
        }

        for (let page = start; page <= end; page++) {
          pagesToRemove.add(page - 1);
        }
      } else {
        const page = Number(part);

        if (!Number.isInteger(page) || page < 1 || page > totalPages) {
          cleanupFile(req.file.path);

          return sendApiError(
            res,
            400,
            "INVALID_PAGE_RANGE",
            "Página inválida.",
            `Página inválida: ${part}. O PDF tem ${totalPages} página(s).`
          );
        }

        pagesToRemove.add(page - 1);
      }
    }

    if (pagesToRemove.size === 0) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PAGE_RANGE",
        "Nenhuma página válida informada.",
        "Confira o intervalo digitado e tente novamente."
      );
    }

    if (pagesToRemove.size >= totalPages) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PAGE_RANGE",
        "Não é possível remover todas as páginas.",
        "O PDF precisa manter pelo menos uma página."
      );
    }

    const newPdf = await PDFDocument.create();

    const pagesToKeep = [];

    for (let i = 0; i < totalPages; i++) {
      if (!pagesToRemove.has(i)) {
        pagesToKeep.push(i);
      }
    }

    const copiedPages = await newPdf.copyPages(originalPdf, pagesToKeep);

    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });

    const outputName = `removed-${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, outputName);

    const newPdfBytes = await newPdf.save();
    fs.writeFileSync(outputPath, newPdfBytes);

    cleanupFile(req.file.path);

    return res.json({
      fileUrl: `${BASE_URL}/files/${outputName}`,
    });
  } catch (error: any) {
    console.error("Erro ao remover páginas:", error);

    cleanupFile(req.file?.path);

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao remover páginas.",
      getErrorDetail(error)
    );
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API saudável" });
});

app.post("/ai/pdf-tools", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!text) {
      return sendApiError(
        res,
        400,
        "INVALID_FILE",
        "Texto não enviado.",
        "Envie um texto para a IA processar."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao processar IA com Gemini.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/protect", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/protect =======");

    const password = req.body.password;

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (!password) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "PASSWORD_REQUIRED",
        "Senha não enviada.",
        "Digite uma senha para proteger o PDF."
      );
    }

    console.log("Arquivo:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Tamanho MB:", (req.file.size / 1024 / 1024).toFixed(2));
    console.log("Path:", req.file.path);

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao proteger PDF.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/unlock", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/unlock =======");

    const password = req.body.password;

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (!password) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "PASSWORD_REQUIRED",
        "Senha do PDF não enviada.",
        "Digite a senha atual do PDF."
      );
    }

    console.log("Arquivo:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Tamanho MB:", (req.file.size / 1024 / 1024).toFixed(2));
    console.log("Path:", req.file.path);

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
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

    const detail = getErrorDetail(error);
    const text = detail.toLowerCase();

    if (
      text.includes("password") ||
      text.includes("senha") ||
      text.includes("incorrect") ||
      text.includes("wrong")
    ) {
      return sendApiError(
        res,
        400,
        "PDF_WRONG_PASSWORD",
        "Senha incorreta.",
        "A senha informada não desbloqueou este PDF."
      );
    }

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao desbloquear PDF.",
      detail
    );
  }
});

app.post("/pdf/watermark", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/watermark =======");

    const { text } = req.body;

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (!text || !String(text).trim()) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "WATERMARK_TEXT_REQUIRED",
        "Texto da marca d'água não enviado.",
        "Digite o texto que deseja aplicar como marca d'água."
      );
    }

    console.log("Arquivo:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Tamanho MB:", (req.file.size / 1024 / 1024).toFixed(2));
    console.log("Path:", req.file.path);

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao aplicar marca d'água.",
      getErrorDetail(error)
    );
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

        return sendApiError(
          res,
          400,
          "NO_FILE_SELECTED",
          "PDF não enviado.",
          "Selecione um PDF antes de assinar."
        );
      }

      if (!signatureFile) {
        cleanupFile(pdfFile.path);

        return sendApiError(
          res,
          400,
          "SIGNATURE_REQUIRED",
          "Assinatura não enviada.",
          "Desenhe ou selecione uma assinatura antes de continuar."
        );
      }

      console.log("PDF:", pdfFile.originalname, pdfFile.mimetype, pdfFile.size);
      console.log("Assinatura:", signatureFile.originalname, signatureFile.mimetype, signatureFile.size);

      if (pdfFile.mimetype !== "application/pdf") {
        cleanupFile(pdfFile.path);
        cleanupFile(signatureFile.path);

        return sendApiError(
          res,
          400,
          "INVALID_PDF",
          "Arquivo inválido.",
          "O arquivo enviado não é um PDF válido."
        );
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

        return sendApiError(
          res,
          400,
          "INVALID_FILE",
          "Assinatura inválida.",
          "A assinatura precisa ser PNG ou JPG."
        );
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

      return sendApiError(
        res,
        500,
        "SERVER_ERROR",
        "Erro ao assinar PDF.",
        getErrorDetail(error)
      );
    }
  }
);

app.post("/pdf/compress", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/compress =======");

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao comprimir PDF.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/pdf-to-word =======");

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao converter PDF para Word.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/merge", upload.array("files", 10), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/merge =======");

    if (!files || files.length < 2) {
      return sendApiError(
        res,
        400,
        "MIN_FILES_REQUIRED",
        "Envie pelo menos 2 PDFs.",
        "Selecione dois ou mais PDFs para juntar."
      );
    }

    for (const file of files) {
      if (file.mimetype !== "application/pdf") {
        files.forEach((f) => cleanupFile(f.path));

        return sendApiError(
          res,
          400,
          "INVALID_PDF",
          "Arquivos inválidos.",
          "Todos os arquivos precisam ser PDF."
        );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao juntar PDFs.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/split", upload.single("file"), async (req, res) => {
  try {
    console.log("======= NOVA REQUISIÇÃO /pdf/split =======");

    const ranges = req.body.ranges;

    if (!req.file) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "Arquivo não enviado.",
        "Selecione um PDF antes de continuar."
      );
    }

    if (!ranges) {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PAGE_RANGE",
        "Intervalo de páginas não enviado.",
        "Digite o intervalo de páginas. Exemplo: 1-3, 5 ou 2,4,6."
      );
    }

    if (req.file.mimetype !== "application/pdf") {
      cleanupFile(req.file.path);

      return sendApiError(
        res,
        400,
        "INVALID_PDF",
        "Arquivo inválido.",
        "O arquivo enviado não é um PDF válido."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao dividir PDF.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/protect-base64", express.json({ limit: "80mb" }), async (req, res) => {
  let inputPath = "";

  try {
    const { pdfBase64, password } = req.body;

    if (!pdfBase64) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "PDF não enviado.",
        "Envie o PDF antes de continuar."
      );
    }

    if (!password) {
      return sendApiError(
        res,
        400,
        "PASSWORD_REQUIRED",
        "Senha não enviada.",
        "Digite uma senha para proteger o PDF."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao proteger PDF.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/unlock-base64", express.json({ limit: "80mb" }), async (req, res) => {
  let inputPath = "";

  try {
    const { pdfBase64, password } = req.body;

    if (!pdfBase64) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "PDF não enviado.",
        "Envie o PDF antes de continuar."
      );
    }

    if (!password) {
      return sendApiError(
        res,
        400,
        "PASSWORD_REQUIRED",
        "Senha não enviada.",
        "Digite a senha atual do PDF."
      );
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

    const detail = getErrorDetail(error);
    const text = detail.toLowerCase();

    if (
      text.includes("password") ||
      text.includes("senha") ||
      text.includes("incorrect") ||
      text.includes("wrong")
    ) {
      return sendApiError(
        res,
        400,
        "PDF_WRONG_PASSWORD",
        "Senha incorreta.",
        "A senha informada não desbloqueou este PDF."
      );
    }

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao desbloquear PDF.",
      detail
    );
  }
});

app.post("/pdf/watermark-base64", express.json({ limit: "80mb" }), async (req, res) => {
  try {
    const { pdfBase64, text } = req.body;

    if (!pdfBase64) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "PDF não enviado.",
        "Envie o PDF antes de continuar."
      );
    }

    if (!text || !String(text).trim()) {
      return sendApiError(
        res,
        400,
        "WATERMARK_TEXT_REQUIRED",
        "Texto da marca d'água não enviado.",
        "Digite o texto que deseja aplicar como marca d'água."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao aplicar marca d'água.",
      getErrorDetail(error)
    );
  }
});

app.post("/pdf/sign-base64", express.json({ limit: "80mb" }), async (req, res) => {
  try {
    const { pdfBase64, signatureBase64, page, x, y, width, height } = req.body;

    if (!pdfBase64) {
      return sendApiError(
        res,
        400,
        "NO_FILE_SELECTED",
        "PDF não enviado.",
        "Envie o PDF antes de continuar."
      );
    }

    if (!signatureBase64) {
      return sendApiError(
        res,
        400,
        "SIGNATURE_REQUIRED",
        "Assinatura não enviada.",
        "Desenhe ou selecione uma assinatura antes de continuar."
      );
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

    return sendApiError(
      res,
      500,
      "SERVER_ERROR",
      "Erro ao assinar PDF.",
      getErrorDetail(error)
    );
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("[ERRO GLOBAL]", err);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return sendApiError(
      res,
      413,
      "FILE_TOO_LARGE",
      "Arquivo muito grande.",
      "O limite atual foi excedido."
    );
  }

  return sendApiError(
    res,
    500,
    "SERVER_ERROR",
    "Erro interno no servidor.",
    getErrorDetail(err)
  );
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