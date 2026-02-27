import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
	id: string;
	username: string;
	email: string;
	avatar_url: string;
}

interface AuthState {
	user: User | null;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		loading: true
	});

	let checkPromise: Promise<void> | null = null;

	return {
		subscribe,
		check: async () => {
			if (!browser) return;
			if (checkPromise) return checkPromise;
			
			checkPromise = (async () => {
				try {
					const response = await fetch('/api/user');
					if (response.ok) {
						const data = await response.json();
						set({ user: data.user, loading: false });
					} else {
						set({ user: null, loading: false });
					}
				} catch {
					set({ user: null, loading: false });
					// Reset on failure so next check() retries instead of returning stale error
					checkPromise = null;
				}
			})();
			
			return checkPromise;
		},
		logout: () => {
			checkPromise = null;
			set({ user: null, loading: false });
		}
	};
}

export const auth = createAuthStore();
