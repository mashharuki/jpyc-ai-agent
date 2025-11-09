#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { getContext } from '../lib/types';

const app = new cdk.App();

// CDK Contextを取得
const context = getContext(app);

// AgentCore Stackをデプロイする
new CdkStack(app, 'JPYCAIAgentCoreCdkStack', {
  context,
  env: {
    region: context.region,
  },
  description: 'JPYC AI Agent - Serverless Infrastructure Stack',
});
