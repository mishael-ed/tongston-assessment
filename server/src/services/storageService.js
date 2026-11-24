import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config.js';

const uploadRoot = path.resolve('uploads');

async function mockUpload(file) {
  const key = `cloudinary/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  const target = path.join(uploadRoot, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.buffer);
  return { providerKey: key, url: `/uploads/${key}` };
}

async function mockPromote(asset) {
  const source = path.join(uploadRoot, asset.providerKey);
  const key = `s3/${path.basename(asset.providerKey)}`;
  const target = path.join(uploadRoot, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
  await fs.unlink(source).catch(() => {});
  return { providerKey: key, url: `/uploads/${key}` };
}

async function cloudUpload(file) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
  });
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto', folder: 't-world' }, (error, value) => {
      if (error) reject(error); else resolve(value);
    });
    stream.end(file.buffer);
  });
  return { providerKey: result.public_id, url: result.secure_url };
}

async function cloudPromote(asset) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error('Could not download source asset from Cloudinary');
  const body = Buffer.from(await response.arrayBuffer());
  const key = `promoted/${randomUUID()}-${asset.originalName}`;
  const client = new S3Client({ region: config.AWS_REGION });
  await client.send(new PutObjectCommand({
    Bucket: config.AWS_S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: asset.mimeType
  }));
  await cloudinary.uploader.destroy(asset.providerKey, { resource_type: 'auto' });
  return {
    providerKey: key,
    url: `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`
  };
}

export const storageService = {
  upload: (file) => config.STORAGE_DRIVER === 'cloud' ? cloudUpload(file) : mockUpload(file),
  promote: (asset) => config.STORAGE_DRIVER === 'cloud' ? cloudPromote(asset) : mockPromote(asset)
};
