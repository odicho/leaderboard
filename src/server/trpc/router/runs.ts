import { z } from "zod";
import { prisma } from "../../../server/db/client";
import { router, publicProcedure } from "../trpc";
import dayjs from "dayjs";

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
		.input(
			z.object({
				userId: z.string(),
				distance: z.number(),
				activity: z.string(),
				date: z.string(),
			})
		)
		.mutation(async ({ input: { userId, distance, activity, date } }) => {
			const { distance: distancePosted } = await prisma.run.create({
				data: {
					distance: distance,
					user: { connect: { id: userId } },
					activity,
					date,
				},
			});
			return distancePosted;
		}),
});
