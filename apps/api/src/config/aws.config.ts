import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'ap-south-1',
  s3Bucket: process.env.AWS_S3_BUCKET,
  s3Endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
  sesFromEmail: process.env.AWS_SES_FROM_EMAIL,
}));
