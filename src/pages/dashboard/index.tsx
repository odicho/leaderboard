import { GetServerSideProps } from "next";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { EARTH_CIRCUMFERENCE } from "../../constants/constants";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { trpc } from "../../utils/trpc";
import "cal-sans";

export default function Dashboard() {
	const { data: session } = useSession();
	const getUsers = trpc.user.getAllUsersAndMiles.useQuery();
	const setRun = trpc.run.setRun.useMutation();

	const handleSetRun = async () => {
		setRun.mutate({
			userId: session!.user!.id,
		});
	};

	const dataAvailable = !getUsers.isLoading && getUsers.data;
	const percentageOfGoal = dataAvailable
		? (getUsers.data.totalMiles / EARTH_CIRCUMFERENCE) * 100
		: 0;
	const roundedPercentageOfGoal =
		Math.round(percentageOfGoal * 100 + Number.EPSILON) / 100;

	return (
		<>
			<div className="flex justify-center py-24">
				<h1 className="text-4xl text-[#111111]">
					We have collectively moved{" "}
					<span className="font-bold underline">
						{dataAvailable ? getUsers.data.totalMiles : 0}
					</span>{" "}
					miles
				</h1>
			</div>
			<div className="px-10">
				<div className="h-6 w-full rounded-full bg-white">
					<div
						className="flex h-6 items-center justify-center rounded-full bg-blue-700 p-0.5 text-xs font-medium leading-none text-white"
						style={{ width: `${roundedPercentageOfGoal}%` }}
					>
						{roundedPercentageOfGoal > 2 ? roundedPercentageOfGoal + "%" : ""}
					</div>
				</div>
				<div className="pb-4"></div>
				<table className="w-full text-[#111111]">
					<thead>
						<tr className="border border-[#E2E8F0]">
							<th className="px-8 py-4">Name</th>
							<th className="px-8 py-4">Miles</th>
						</tr>
					</thead>
					<tbody>
						{dataAvailable &&
							getUsers.data.usersToMiles.map((user) => {
								return (
									<tr key={user.id} className="border border-[#E2E8F0]">
										<td className="flex items-center gap-4 px-8 py-4">
											<Image
												src={user.image!}
												alt={"Profile Picture"}
												width={64}
												height={64}
												className="rounded-full"
											/>
											<p>{user.name}</p>
										</td>
										<td className="px-8 py-4">{user.miles}</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>
			<button onClick={handleSetRun}>Add Run</button>
			<SignOutButton />
		</>
	);
}

const SignOutButton = () => {
	return (
		<button
			className="py-4 px-10 font-medium text-white hover:text-[#02C39A]"
			onClick={() => {
				signOut({ callbackUrl: "/" });
			}}
		>
			{"Sign Out"}
		</button>
	);
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getServerAuthSession({ req, res });

	if (!session || !session.user) {
		return {
			redirect: {
				destination: "/",
				permanent: false,
			},
		};
	}

	return {
		props: {
			session,
		},
	};
};
