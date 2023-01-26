import { Run } from "@prisma/client";
import { prisma } from "../../server/db/client";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

type RunsByWeek = {
	[key: number]: {
		week: {
			[key: number]: {
				totalMilesWeek: number;
			};
		};
		totalMilesYear: number;
	};
};

const categorizeRunsByWeek = (runs: Run[]) => {
	const runsByWeek: RunsByWeek = {};
	let totalMilesYear = 0;
	runs.forEach((run) => {
		const { id, distance, userId, createdAt } = run;
		const date = dayjs(createdAt);
		const week = date.week();
		const year = date.year();

		if (!runsByWeek[year]) {
			runsByWeek[year] = { week: {}, totalMilesYear: 0 };
		}
		if (!runsByWeek[year].week[week]) {
			runsByWeek[year].week[week] = { totalMilesWeek: 0 };
		}

		runsByWeek[year].week[week].totalMilesWeek += distance;
		runsByWeek[year].totalMilesYear += distance;
	});

	return runsByWeek;
};

export interface Profile {
	id: string;
	name: string;
	image: string;
	runsByWeek: RunsByWeek;
}

export const getProfile = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
			name: true,
			image: true,
			runs: true,
		},
	});

	if (!user || !user.name || !user.image) {
		return null;
	}

	const runsByWeek =
		user.runs.length > 0 ? categorizeRunsByWeek(user.runs) : {};
	const { id, name, image } = user;

	const profile: Profile = { id, name, image, runsByWeek };

	return profile;
};
