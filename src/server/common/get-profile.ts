import { Run } from "@prisma/client";
import { prisma } from "../../server/db/client";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

type RunsByWeek = {
	[key: number]: {
		[key: number]: {
			userId: string;
			distance: number;
			date: string;
		}[];
	};
};

const categorizeRunsByWeek = (runs: Run[]) => {
	const runsByWeek: RunsByWeek = {};
	runs.forEach((run) => {
		const { distance, userId, createdAt } = run;
		const date = dayjs(createdAt);
		const week = date.week();
		const year = date.year();

		if (!runsByWeek[year]) {
			runsByWeek[year] = {};
		}
		if (!runsByWeek[year][week]) {
			runsByWeek[year][week] = [];
		}
		runsByWeek[year][week].push({ distance, userId, date: date.toISOString() });
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
		throw new Error("User not found");
	}

	const runsByWeek =
		user.runs.length > 0 ? categorizeRunsByWeek(user.runs) : {};
	const { id, name, image } = user;

	const profile: Profile = { id, name, image, runsByWeek };

	return profile;
};
