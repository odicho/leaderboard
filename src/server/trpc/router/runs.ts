import { z } from "zod";
import { prisma } from "../../../server/db/client";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import dayjs from "dayjs";

export const runRouter = router({
	getAllUsersRuns: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input: { userId } }) => {
			const users = await prisma.user.findMany({});
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
	setRun: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				distance: z.number(),
				steps: z.number(),
				activity: z.string(),
				date: z.string(),
			})
		)
		.mutation(
			async ({ input: { userId, distance, steps, activity, date } }) => {
				const { distance: distancePosted } = await prisma.run.create({
					data: {
						distance,
						user: { connect: { id: userId } },
						activity,
						date,
						steps,
					},
				});
				return distancePosted;
			}
		),
	deleteRun: protectedProcedure
		.input(z.object({ id: z.string(), distance: z.number() }))
		.mutation(async ({ input: { id } }) => {
			const run = await prisma.run.delete({
				where: {
					id: id,
				},
			});
			return run;
		}),
});
