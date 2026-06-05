#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { execSync } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('ai-review')
  .description('AI Code Reviewer CLI')
  .version('1.0.0');

program
  .command('diff')
  .description('Review local git changes')
  .option('-o, --owner <owner>', 'GitHub/GitLab username or organization', process.env.AI_OWNER)
  .option('-s, --staged', 'Review staged changes')
  .option('-p, --provider <provider>', 'AI provider (openai, claude, openrouter)', process.env.AI_PROVIDER || 'openai')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (options) => {
    try {
      if (!options.owner) {
        throw new Error('Owner is required. Use --owner or set AI_OWNER env var.');
      }

      const diffCommand = options.staged ? 'git diff --staged' : 'git diff';
      const diff = execSync(diffCommand).toString();

      if (!diff) {
        console.log(chalk.yellow('No changes detected.'));
        return;
      }

      await performReview(diff, options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('stdin')
  .description('Review diff from stdin')
  .option('-o, --owner <owner>', 'GitHub/GitLab username or organization', process.env.AI_OWNER)
  .option('-p, --provider <provider>', 'AI provider (openai, claude, openrouter)', process.env.AI_PROVIDER || 'openai')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (options) => {
    try {
      if (!options.owner) {
        throw new Error('Owner is required. Use --owner or set AI_OWNER env var.');
      }

      const diff = fs.readFileSync(0, 'utf8');
      if (!diff) {
        console.log(chalk.yellow('No input received via stdin.'));
        return;
      }

      await performReview(diff, options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

async function performReview(diff: string, options: any) {
  const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3000";
  const apiSecret = process.env.DASHBOARD_API_SECRET;

  console.log(chalk.blue(`Requesting review from dashboard for ${options.owner}...`));

  try {
    const response = await axios.post(`${dashboardUrl}/api/review`, {
      owner: options.owner,
      diff: diff,
      provider: options.provider,
      model: options.model
    }, {
      headers: apiSecret ? { 'Authorization': `Bearer ${apiSecret}` } : {}
    });

    console.log(chalk.green('\n--- AI Code Review ---\n'));
    console.log(response.data.review);
    console.log(chalk.green('\n----------------------\n'));
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error(chalk.red(`Review failed: ${errorMessage}`));
  }
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
