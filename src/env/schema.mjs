import { z } from "zod";

export const serverSchema = z.object({
	DATABASE_URL: z.string().url(),
	NODE_ENV: z.enum(["development", "test", "production"]),
	NEXTAUTH_URL: z.preprocess(
		// This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
		// Since NextAuth automatically uses the VERCEL_URL if present.
		(str) => process.env.VERCEL_URL ?? str,
		// VERCEL_URL doesnt include `https` so it cant be validated as a URL
		process.env.VERCEL ? z.string() : z.string().url()
	),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
});
