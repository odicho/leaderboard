import { z } from "zod";
import { prisma } from "../../../server/db/client";
import { router, publicProcedure } from "../trpc";

export const runRouter = router({
	getAllUsersRuns: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input: { userId } }) => {
			const users = await prisma.user.findMany({});
			console.log(JSON.stringify(users));
		}),
	getRuns: publicProcedure
		.input(
			z.object({
				userId: z.string(),
			})
		)
		.query(async ({ input: { userId } }) => {
			const runs = await prisma.run.findMany({
				where: {
					userId: userId,
				},
			});
			return runs;
		}),
	setRun: publicProcedure
		.input(z.object({ userId: z.string(), distance: z.number() }))
		.mutation(async ({ input: { userId, distance } }) => {
			const { distance: distancePosted } = await prisma.run.create({
				data: {
					distance: distance,
					user: { connect: { id: userId } },
				},
			});
			return distancePosted;
		}),
});
