import { router } from "../trpc";
import { profileRouter } from "./profile";
import { runRouter } from "./runs";
import { userRouter } from "./users";

export const appRouter = router({
	run: runRouter,
	user: userRouter,
	profile: profileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

