export type JpmcSection={
  id:string;
  number:string;
  title:string;
  blurb:string;
  href:string;
  mode:'domain'|'messaging'|'integration'|'platform'|'interview';
};

export const JPMC_SIDEBAR_ORDER=[
  'jpmc-experience-index',
  'jpmc-hadron-cashlines',
  'jpmc-cdc',
  'jpmc-kafka-error-handling',
  'jpmc-kafka-global-exception-handling',
  'jpmc-kafka-replay-tool',
  'jpmc-kafka-monitoring',
  'jpmc-avro',
  'jpmc-participants-onboarding',
  'jpmc-swagger-openapi',
  'jpmc-deloitte-tax',
  'jpmc-camunda-workflow',
  'jpmc-drools',
  'jpmc-graphql-s3-sqs',
  'jpmc-async-tracker-callback',
  'jpmc-spring-batch',
  'jpmc-rsu',
  'jpmc-maker-checker',
  'jpmc-automation-testing',
  'jpmc-playwright',
  'jpmc-wiremock',
  'jpmc-terraform-aws',
  'jpmc-spring-security-config',
  'jpmc-harness-deployment',
  'jpmc-spring-migration',
  'jpmc-production-support',
  'jpmc-e2e-tracking-failure',
  'jpmc-system-design',
  'jpmc-star-stories',
  'jpmc-top-100-questions',
  'jpmc-cheat-sheet',
];

export const JPMC_HUB={
  slug:'jpmc',
  title:'JPMC Experience',
  subtitle:'Hadron · Deloitte Tax · RSU · Platform',
  description:
    'Interview-ready stories from JPMorgan Chase work: Cashlines, CDC, Kafka production, tax integration, RSU processing, Terraform/AWS, testing, migration, and production ownership — not textbook definitions.',
  basePath:'/jpmc-experience',
  sections:[
    {
      id:'domain',
      number:'01',
      title:'Hadron & Cashlines',
      blurb:'Business domain, Cashline lifecycle, consistency, and operational support.',
      href:'/jpmc-experience/jpmc-hadron-cashlines',
      mode:'domain' as const,
    },
    {
      id:'messaging',
      number:'02',
      title:'CDC & Kafka Production',
      blurb:'CDC, error handling, Spring Kafka recoverers, replay, Avro, monitoring.',
      href:'/jpmc-experience/jpmc-cdc',
      mode:'messaging' as const,
    },
    {
      id:'onboarding',
      number:'03',
      title:'Onboarding & APIs',
      blurb:'Participants / operational accounts, REST, Swagger/OpenAPI contracts.',
      href:'/jpmc-experience/jpmc-participants-onboarding',
      mode:'domain' as const,
    },
    {
      id:'tax',
      number:'04',
      title:'Deloitte Tax Integration',
      blurb:'Camunda, Drools, GraphQL, S3, SQS, async tracker, callbacks.',
      href:'/jpmc-experience/jpmc-deloitte-tax',
      mode:'integration' as const,
    },
    {
      id:'rsu',
      number:'05',
      title:'JPM RSU & Batch',
      blurb:'File listeners, Drools validation, Spring Batch chunk processing.',
      href:'/jpmc-experience/jpmc-rsu',
      mode:'integration' as const,
    },
    {
      id:'platform',
      number:'06',
      title:'Platform, Cloud & DevOps',
      blurb:'Terraform, AWS, ALB, certs, Harness, security, env config.',
      href:'/jpmc-experience/jpmc-terraform-aws',
      mode:'platform' as const,
    },
    {
      id:'quality',
      number:'07',
      title:'Testing & Migration',
      blurb:'Playwright, WireMock, automation strategy, Spring/JAR migration.',
      href:'/jpmc-experience/jpmc-automation-testing',
      mode:'platform' as const,
    },
    {
      id:'interview',
      number:'08',
      title:'Interview Bank',
      blurb:'STAR stories, system design, Top 100 questions, cheat sheets.',
      href:'/jpmc-experience/jpmc-star-stories',
      mode:'interview' as const,
    },
  ] satisfies JpmcSection[],
};
