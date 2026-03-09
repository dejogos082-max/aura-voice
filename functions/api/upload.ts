interface Env {
  MY_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uid = formData.get("uid") as string;

    if (!file || !uid) {
      return new Response(JSON.stringify({ error: "File and uid are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limite de 10MB manual
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size exceeds 10MB limit" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar tipo MIME
    if (!file.type) {
      return new Response(JSON.stringify({ error: "Invalid file type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const extension = file.name.split(".").pop();
    // Organizar em pastas: uploads/{uid}/{filename}
    // Gerar nome único usando crypto.randomUUID()
    const uniqueFileName = `uploads/${uid}/${crypto.randomUUID()}.${extension}`;

    // Usar Cloudflare R2 Binding
    await env.MY_BUCKET.put(uniqueFileName, file, {
      httpMetadata: { contentType: file.type },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${uniqueFileName}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
