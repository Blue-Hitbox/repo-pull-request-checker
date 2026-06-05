import { Probot } from "probot";
import axios from "axios";

interface Config {
  provider?: string;
  model?: string;
}

async function requestReviewFromDashboard(owner: string, diff: string, config?: Config | null): Promise<string> {
  const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3000";
  const apiSecret = process.env.DASHBOARD_API_SECRET;

  const response = await axios.post(`${dashboardUrl}/api/review`, {
    owner,
    diff,
    provider: config?.provider,
    model: config?.model
  }, {
    headers: apiSecret ? { 'Authorization': `Bearer ${apiSecret}` } : {}
  });

  return response.data.review;
}

export = (app: Probot) => {
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const { owner, repo, pull_number } = context.pullRequest();

    try {
      // Get the configuration from the repository
      const config = await context.config<Config>("ai-reviewer.yml", {
        provider: process.env.AI_PROVIDER || "openai",
        model: process.env.AI_MODEL,
      });

      // Get the diff of the pull request
      const response = await context.octokit.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: {
          format: "diff",
        },
      });

      const diff = response.data as unknown as string;

      if (typeof diff !== "string") {
        app.log.error("Diff is not a string");
        return;
      }

      // Check if diff is too large
      if (diff.length > 50000) {
        app.log.warn("Diff is too large for AI review");
        await context.octokit.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body: "⚠️ PR diff is too large for automated AI review.",
        });
        return;
      }

      app.log.info(`Requesting review from dashboard for ${owner}/${repo}...`);

      const review = await requestReviewFromDashboard(owner, diff, config);

      // Post the review as a comment
      await context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `### AI Code Review\n\n${review}`,
      });

      app.log.info(`Review posted for PR #${pull_number}`);
    } catch (error: any) {
      app.log.error(error, "Error during PR review");

      const errorMessage = error.response?.data?.error || error.message;
      await context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `❌ AI Code Review failed: ${errorMessage}.`,
      });
    }
  });
};
