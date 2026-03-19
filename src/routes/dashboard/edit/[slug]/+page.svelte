<script lang="ts">
	import ConfigEditor from '$lib/components/ConfigEditor.svelte';

	let { data } = $props();
	const slug = $derived(data.slug === '_new' ? undefined : data.slug);
</script>

<ConfigEditor {slug} />
