import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'ap-south-1',
  s3Bucket: process.env.AWS_S3_BUCKET,
  cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
  sesFromEmail: process.env.AWS_SES_FROM_EMAIL,
}));
