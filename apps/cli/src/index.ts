#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
const program = new Command();
const CONFIG_PATH = path.join(os.homedir(), '.ai-review-config.json');

function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  fs.chmodSync(CONFIG_PATH, 0o600);
}

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  return {};
}

program
  .name('ai-review')
  .description('AI Code Reviewer CLI')
  .version('1.0.0');

program
  .command('login <token>')
  .description('Login to the dashboard with a CLI token')
  .action(async (token) => {
    const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:5173";
    try {
      console.log(chalk.blue('Verifying token...'));
      const response = await axios.post(`${dashboardUrl}/api/tokens/verify`, { token });

      if (response.data.success) {
        saveConfig({ token, username: response.data.username });
        console.log(chalk.green(`Successfully logged in as ${response.data.username}`));
      } else {
        console.error(chalk.red('Invalid token.'));
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      console.error(chalk.red(`Login failed: ${msg}`));
    }
  });

program
  .command('diff')
  .description('Review local git changes')
  .option('-o, --owner <owner>', 'GitHub/GitLab username or organization')
  .option('-r, --repo <repo>', 'Repository name (e.g. owner/repo)')
  .option('-s, --staged', 'Review staged changes')
  .option('-p, --provider <provider>', 'AI provider (openai, claude, openrouter)', process.env.AI_PROVIDER || 'openai')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const owner = options.owner || config.username;

      if (!owner && !config.token) {
        throw new Error('Owner is required or you must be logged in. Use --owner or "ai-review login <token>".');
      }

      const diffCommand = options.staged ? 'git diff --staged' : 'git diff';
      const { stdout: diff } = await execAsync(diffCommand);

      if (!diff.trim()) {
        console.log(chalk.yellow('No changes detected.'));
        return;
      }

      await performReview(diff, { ...options, owner, token: config.token });
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('stdin')
  .description('Review diff from stdin')
  .option('-o, --owner <owner>', 'GitHub/GitLab username or organization')
  .option('-r, --repo <repo>', 'Repository name (e.g. owner/repo)')
  .option('-p, --provider <provider>', 'AI provider (openai, claude, openrouter)', process.env.AI_PROVIDER || 'openai')
  .option('-m, --model <model>', 'AI model to use')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const owner = options.owner || config.username;

      if (!owner && !config.token) {
        throw new Error('Owner is required or you must be logged in. Use --owner or "ai-review login <token>".');
      }

      const diff = fs.readFileSync(0, 'utf8');
      if (!diff.trim()) {
        console.log(chalk.yellow('No input received via stdin.'));
        return;
      }

      await performReview(diff, { ...options, owner, token: config.token });
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

async function performReview(diff: string, options: any) {
  const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:5173";
  const apiSecret = process.env.DASHBOARD_API_SECRET;
  const token = options.token || apiSecret;

  console.log(chalk.blue(`Requesting review from dashboard for ${options.owner}...`));

  try {
    const response = await axios.post(`${dashboardUrl}/api/review`, {
      owner: options.owner,
      repoName: options.repo,
      diff: diff,
      provider: options.provider,
      model: options.model
    }, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
