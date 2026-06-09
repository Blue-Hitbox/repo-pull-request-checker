<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="AI Code Reviewer — Self-hosted code review powered by AI" />
	<meta name="theme-color" content="#6366f1" />
	<meta name="robots" content="noindex, nofollow" />
	<title>AI Code Reviewer</title>
</svelte:head>

{@render children()}
