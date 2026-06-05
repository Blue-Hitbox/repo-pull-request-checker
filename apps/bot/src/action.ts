import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

async function run() {
  try {
    const providerName = core.getInput('provider');
    const modelName = core.getInput('model');
    const githubToken = core.getInput('github_token');
    const dashboardUrl = core.getInput('dashboard_url') || process.env.DASHBOARD_URL || "http://localhost:3000";
    const apiSecret = core.getInput('dashboard_api_secret') || process.env.DASHBOARD_API_SECRET;

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

    core.info(`Requesting review from dashboard for ${context.repo.owner}...`);

    const response = await axios.post(`${dashboardUrl}/api/review`, {
      owner: context.repo.owner,
      diff: diffString,
      provider: providerName,
      model: modelName
    }, {
      headers: apiSecret ? { 'Authorization': `Bearer ${apiSecret}` } : {}
    });

    const review = response.data.review;

    core.info('Posting review comment...');
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pullRequest.number,
      body: `### AI Code Review\n\n${review}`,
    });

    core.info('Review posted successfully.');
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message;
    core.setFailed(errorMessage);
  }
}

run();
