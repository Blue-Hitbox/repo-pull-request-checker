import { Probot } from "probot";
import { getProvider } from "@ai-reviewer/core";
import axios from "axios";

interface Config {
  provider?: string;
  model?: string;
}

async function getUserApiKey(owner: string, provider: string): Promise<string | undefined> {
  const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3000";
  const apiSecret = process.env.DASHBOARD_API_SECRET;

  try {
    const response = await axios.get(`${dashboardUrl}/api/keys/${owner}/${provider}`, {
      headers: apiSecret ? { 'Authorization': `Bearer ${apiSecret}` } : {}
    });
    return response.data.apiKey;
  } catch (error) {
    return undefined;
  }
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

      const providerName = config?.provider || "openai";

      // Fetch API key from dashboard
      const userApiKey = await getUserApiKey(owner, providerName);

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

      const provider = getProvider({
        provider: providerName,
        model: config?.model,
        apiKey: userApiKey,
      });

      app.log.info(`Requesting review from ${providerName} (model: ${config?.model || 'default'})...`);

      const review = await provider.reviewCode(diff);

      // Post the review as a comment
      await context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `### AI Code Review (${providerName}${config?.model ? ` - ${config.model}` : ''})\n\n${review}`,
      });

      app.log.info(`Review posted for PR #${pull_number}`);
    } catch (error: any) {
      app.log.error(error, "Error during PR review");

      const errorMessage = error instanceof Error ? error.message : String(error);
      await context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `❌ AI Code Review failed: ${errorMessage}. Make sure you have set your API key in the dashboard correctly.`,
      });
    }
  });
};
