#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { getProvider } from '@ai-reviewer/core';
import * as fs from 'fs';
import { execSync } from 'child_process';
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
  .option('-s, --staged', 'Review staged changes')
  .option('-p, --provider <provider>', 'AI provider (openai, claude, openrouter)', process.env.AI_PROVIDER || 'openai')
  .option('-m, --model <model>', 'AI model to use')
  .option('-k, --key <key>', 'AI API key', process.env.AI_API_KEY)
  .action(async (options) => {
    try {
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
  .option('-p, --provider <provider>', 'AI provider (openai, claude, openrouter)', process.env.AI_PROVIDER || 'openai')
  .option('-m, --model <model>', 'AI model to use')
  .option('-k, --key <key>', 'AI API key', process.env.AI_API_KEY)
  .action(async (options) => {
    try {
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
  const provider = getProvider({
    provider: options.provider,
    model: options.model,
    apiKey: options.key
  });

  console.log(chalk.blue(`Requesting review from ${options.provider}...`));
  const review = await provider.reviewCode(diff);

  console.log(chalk.green('\n--- AI Code Review ---\n'));
  console.log(review);
  console.log(chalk.green('\n----------------------\n'));
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
