import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

import { Inter } from "@next/font/google";

const inter = Inter({
	display: "swap",
	subsets: ["latin"],
});

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps },
}) => {
	return (
		<SessionProvider session={session}>
			<main className={inter.className}>
				<Component {...pageProps} />
			</main>
		</SessionProvider>
	);
};

export default trpc.withTRPC(MyApp);
