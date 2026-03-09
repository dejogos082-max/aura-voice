import express from "express";
import { createServer as createViteServer } from "vite";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const uid = req.body.uid;
      const folder = req.body.folder || "misc";

      if (!file || !uid) {
        return res.status(400).json({ error: "File and uid are required" });
      }

      const accountId = process.env.R2_ACCOUNT_ID;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucketName = process.env.R2_BUCKET_NAME;
      const publicUrlBase = process.env.R2_PUBLIC_URL;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrlBase) {
        return res.status(500).json({ error: "R2 credentials not configured" });
      }

      const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const extension = file.originalname.split(".").pop();
      const uniqueFileName = `${folder}/${uid}-${Date.now()}-${uuidv4()}.${extension}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const publicUrl = `${publicUrlBase}/${uniqueFileName}`;
      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/livekit-token", async (req, res) => {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ error: "roomName and participantName are required" });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || 'APIYWfxWuT2CR4H';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'b1DBoowxheL6RWkkIruQFx9fpQOFZNfLtbBqAKbHYrtA';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: "LiveKit credentials not configured" });
    }

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
      });
      at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

      const token = await at.toJwt();
      res.json({ token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist/client"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
