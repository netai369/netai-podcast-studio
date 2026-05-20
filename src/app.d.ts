// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

interface ImportMetaEnv {
	readonly VITE_API_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module '*.svelte' {
	import type { SvelteComponent } from 'svelte';
	export default class extends SvelteComponent {}
}

export {};
