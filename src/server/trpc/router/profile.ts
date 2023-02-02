import { z } from "zod";
import { getProfile } from "../../common/get-profile";
import { router, publicProcedure } from "../trpc";

export const profileRouter = router({
	getProfile: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input: { userId } }) => {
			let profile = getProfile(userId);
			return profile;
		}),
});
