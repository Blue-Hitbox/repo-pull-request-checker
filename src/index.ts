import { Probot } from "probot";
import { getProvider } from "./ai";

export = (app: Probot) => {
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const { owner, repo, pull_number } = context.pullRequest();

    try {
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

      const provider = getProvider();
      app.log.info(`Requesting review from ${process.env.AI_PROVIDER || 'openai'}...`);

      const review = await provider.reviewCode(diff);

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

      const errorMessage = error instanceof Error ? error.message : String(error);
      await context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `❌ AI Code Review failed: ${errorMessage}`,
      });
    }
  });
};
