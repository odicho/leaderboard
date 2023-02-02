import { Run } from "@prisma/client";
import { prisma } from "../../server/db/client";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

type Runs = {
	id: string;
	userId: string;
	distance: number;
	activity: string;
	date: string;
}[];

export type RunsByWeek = {
	[key: number]: {
		week: {
			[key: number]: {
				totalMilesWeek: number;
				runs: Runs;
			};
		};
		totalMilesYear: number;
	};
};

const categorizeRunsByWeek = (runs: Run[]) => {
	const runsByWeek: RunsByWeek = {};

	const currentDate = dayjs();
	const currentWeekOfYear = currentDate.week();
	const currentYear = currentDate.year();

	runs.sort((a, b) => {
		return dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1;
	});

	for (let i = 2023; i <= currentYear; i++) {
		runsByWeek[i] = { week: {}, totalMilesYear: 0 };
		for (let j = 1; j <= currentWeekOfYear; j++) {
			runsByWeek[i].week[j] = { totalMilesWeek: 0, runs: [] };
		}
	}

	runs.forEach((run) => {
		const { id, userId, distance, date, activity } = run;
		const currentDate = dayjs(date);
		const week = currentDate.week();
		const year = currentDate.year();

		runsByWeek[year].week[week].runs.push({
			id,
			userId,
			distance,
			date: date.toISOString(),
			activity,
		});
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

	const runsByWeek = categorizeRunsByWeek(user.runs);
	const { id, name, image } = user;

	const profile: Profile = { id, name, image, runsByWeek };

	return profile;
};
