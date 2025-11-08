#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
// AgentCore Stackをデプロイする
new CdkStack(app, 'JPYCAIAgentCoreCdkStack', {});
