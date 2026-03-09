import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uid = formData.get('uid') as string;
    const folder = formData.get('folder') as string || 'misc';

    if (!file || !uid) {
      return new Response(JSON.stringify({ error: 'File and uid are required' }), { status: 400 });
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size exceeds 10MB limit' }), { status: 400 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const extension = file.name.split('.').pop();
    const uniqueFileName = `${folder}/${uid}-${Date.now()}-${uuidv4()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    await s3Client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    }));

    // Construct the public URL (assuming a custom domain or r2.dev subdomain is configured)
    // You should set R2_PUBLIC_URL in your Cloudflare Pages environment variables
    const publicUrl = `${env.R2_PUBLIC_URL}/${uniqueFileName}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
