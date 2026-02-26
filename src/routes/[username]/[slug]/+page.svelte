<script lang="ts">
	import type { PageData } from './$types';
	import ConfigDetail from '$lib/components/ConfigDetail.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.config.name} - OpenBoot</title>
	<meta name="description" content={data.config.description || `Install ${data.config.name} with OpenBoot`} />
	<meta property="og:title" content="{data.config.name} - OpenBoot" />
	<meta property="og:description" content={data.config.description || `Install ${data.config.name} with OpenBoot — one command to set up your Mac.`} />
	<meta property="og:url" content="https://openboot.dev/{data.configUser.username}/{data.config.slug}" />
	<meta property="og:image" content="https://openboot.dev/{data.configUser.username}/{data.config.slug}/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://openboot.dev/{data.configUser.username}/{data.config.slug}/og" />
</svelte:head>

<ConfigDetail configUser={data.configUser} config={data.config} packageDescriptions={data.packageDescriptions} />
