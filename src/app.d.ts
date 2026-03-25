declare global {
	namespace App {
		interface Locals {
			aliasConfig?: {
				username: string;
				slug: string;
			};
		}
		interface Platform {
			env: {
				DB: D1Database;
				GITHUB_CLIENT_ID: string;
				GITHUB_CLIENT_SECRET: string;
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				JWT_SECRET: string;
				APP_URL: string;
				/** Optional. Webhook URL for health alerts (Discord/Slack/etc). */
				ALERT_WEBHOOK_URL?: string;
			};
		}
		// Cloudflare Workers Cron Trigger handler signature.
		type Scheduled = (event: { platform: Platform | undefined }) => Promise<void>;
	}
}

export {};
