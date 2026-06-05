import * as core from '@actions/core';
import * as github from '@actions/github';
import { getProvider } from '@ai-reviewer/core';

async function run() {
  try {
    const providerName = core.getInput('provider');
    const modelName = core.getInput('model');
    const apiKey = core.getInput('api_key');
    const githubToken = core.getInput('github_token');

    const context = github.context;
    if (context.payload.pull_request == null) {
      core.setFailed('No pull request found.');
      return;
    }

    const pullRequest = context.payload.pull_request;
    const octokit = github.getOctokit(githubToken);

    core.info(`Fetching diff for PR #${pullRequest.number}...`);
    const { data: diff } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pullRequest.number,
      mediaType: {
        format: 'diff',
      },
    });

    const diffString = diff as unknown as string;
    if (diffString.length > 50000) {
      core.warning('Diff is too large for AI review');
      return;
    }

    const provider = getProvider({
      provider: providerName,
      model: modelName,
      apiKey: apiKey,
    });

    core.info(`Requesting review from ${providerName}...`);
    const review = await provider.reviewCode(diffString);

    core.info('Posting review comment...');
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pullRequest.number,
      body: `### AI Code Review (${providerName}${modelName ? ` - ${modelName}` : ''})\n\n${review}`,
    });

    core.info('Review posted successfully.');
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
