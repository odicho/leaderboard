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
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input: { userId } }) => {
			const runs = await prisma.run.create({
				data: {
					distance: 10.34,
					time: 155,
					pace: 15.5,
					user: { connect: { id: userId } },
				},
			});
		}),
});
