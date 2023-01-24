import { router } from "../trpc";
import { runRouter } from "./runs";
import { userRouter } from "./users";

export const appRouter = router({
	run: runRouter,
	user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

