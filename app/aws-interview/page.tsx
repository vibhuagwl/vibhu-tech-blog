import type {Metadata} from 'next';
import AwsInterviewHub from '@/components/aws-interview/aws-interview-hub';

export const metadata: Metadata = {
  title: 'AWS Interview Preparation — Senior / Staff / Architect',
  description:
    'AWS interview hub for Senior Java backend: VPC, IAM, EC2/ECS/EKS/Lambda, RDS/Aurora/DynamoDB, MSK, KMS, CloudWatch, system design, 50+ memory diagrams, troubleshooting.',
};

export default function AwsInterviewPage() {
  return (
    <main>
      <AwsInterviewHub />
    </main>
  );
}
