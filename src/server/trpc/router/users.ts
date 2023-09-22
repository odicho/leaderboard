import { Run } from "@prisma/client";
import dayjs from "dayjs";
import { prisma } from "../../../server/db/client";
import { router, publicProcedure } from "../trpc";

interface User {
  id: string;
  runs: Run[];
  name: string | null;
  image: string | null;
}

// lastInput: 01/30/2023
// streak: 1

// fetch user -> check check if lastInput.week() is equal to last week or this week, if not streak = 0
// add run -> if currentDate - 1 == lastInput -> streak++, update lastInput to current date

const usersToMiles = (users: User[]) => {
  let totalMiles = 0;
  const usersToMiles = users.map((user) => {
    const miles = user.runs.reduce((total, run) => {
      const distance = run.distance;
      totalMiles += distance;
      return total + distance;
    }, 0);

    const roundedMiles = Math.round(miles * 100 + Number.EPSILON) / 100;

    return {
      id: user.id,
      name: user.name?.split(" ")[0],
      image: user.image,
      miles: roundedMiles,
    };
  });

  const roundedTotalMiles = Math.round(totalMiles * 100 + Number.EPSILON) / 100;

  usersToMiles.sort((a, b) => b.miles - a.miles);

  return { usersToMiles, totalMiles: roundedTotalMiles };
};

const usersToSumDistance = (users: User[]) => {
  let totalMiles = 0;
  let totalMilesQuarter = 0;

  const usersReturn = users.map((user) => {
    user.runs.reduce((total, run) => {
      if (
        dayjs(run.date).isAfter(dayjs("2023-01-01")) &&
        dayjs(run.date).isBefore(dayjs("2023-04-01"))
      ) {
        totalMilesQuarter += run.distance;
      }
      const distance = run.distance;
      totalMiles += distance;
      return total + distance;
    }, 0);

    return {
      id: user.id,
      name: user.name?.split(" ")[0],
      image: user.image,
    };
  });

  const roundedTotalMiles = Math.round(totalMiles * 100 + Number.EPSILON) / 100;
  const roundedTotalMilesQuarter =
    Math.round(totalMilesQuarter * 100 + Number.EPSILON) / 100;

  return {
    usersReturn: usersReturn,
    totalMiles: roundedTotalMiles,
    totalMilesQuarter: roundedTotalMilesQuarter,
  };
};

export const userRouter = router({
  getAllUsersAndMiles: publicProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        runs: true,
      },
    });
    return usersToMiles(users);
  }),
  getAllusersAndSumDistance: publicProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        runs: true,
      },
    });

    const { usersReturn, totalMiles, totalMilesQuarter } =
      usersToSumDistance(users);

    return { users: usersReturn, totalMiles, totalMilesQuarter };
  }),
});
