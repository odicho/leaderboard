import { GetServerSideProps } from "next";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { EARTH_CIRCUMFERENCE } from "../constants/constants";
import { getServerAuthSession } from "../server/common/get-server-auth-session";
import { trpc } from "../utils/trpc";
import { useState } from "react";
import "cal-sans";
import Link from "next/link";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Dashboard() {
	const [avatarSelected, setavatarSelected] = useState(false);
	const toggleMobileNav = () => {
		setavatarSelected(!avatarSelected);
	};

	const { data: session, status } = useSession();
	const getUsers = trpc.user.getAllUsersAndMiles.useQuery();
	const setRun = trpc.run.setRun.useMutation();

	const handleSetRun = async () => {
		setRun.mutate({
			userId: session!.user!.id,
		});
	};

	const isUserSignedIn = status === "authenticated";
	const dataAvailable = !getUsers.isLoading && getUsers.data;
	const percentageOfGoal = dataAvailable
		? (getUsers.data.totalMiles / EARTH_CIRCUMFERENCE) * 100
		: 0;
	const roundedPercentageOfGoal =
		Math.round(percentageOfGoal * 100 + Number.EPSILON) / 100;

	return (
		<>
			<nav>
				<div className="border-b">
					<div className="p-6">
						<div className="flex items-center justify-between">
							<h5>
								{"Welcome back, "}
								<span className="font-bold">
									{session?.user?.name?.split(" ")[0]}
								</span>
								!<span className="text-2xl">👋</span>
							</h5>
							{/* <button className="hover:text-blue-700">
								<h6>My Runs</h6>
							</button> */}
							{isUserSignedIn ? <SignOutButton /> : <GoogleSignInButton />}
						</div>
					</div>
				</div>
			</nav>
			<div className="flex justify-center py-24 text-center">
				<h1 className="max-w-sm text-4xl text-[#111111] sm:max-w-lg">
					We have collectively moved{" "}
					<span className="underline">
						{dataAvailable ? getUsers.data.totalMiles : 0}
					</span>{" "}
					miles
				</h1>
			</div>
			<div className="flex flex-col items-center justify-center gap-4 pb-4 sm:flex-row">
				<div className="">How many miles did you move?</div>
				<input
					className="sm::w-full rounded-md border p-1 focus:outline focus:outline-1 focus:outline-blue-700"
					type="number"
					min={0}
					step={0.01}
				/>
				<button className="w-20 hover:font-bold hover:text-blue-700">
					Submit
				</button>
			</div>
			<div className="sm:flex sm:justify-center">
				{/* <div className="h-6 w-full rounded-full bg-white">
					<div
					className="flex h-6 items-center justify-center rounded-full bg-blue-700 p-0.5 text-xs font-medium leading-none text-white"
					style={{ width: `${roundedPercentageOfGoal}%` }}
					>
					{roundedPercentageOfGoal > 2 ? roundedPercentageOfGoal + "%" : ""}
					</div>
				</div> */}
				<table className="w-full text-[#111111] sm:w-[600px]">
					<thead>
						<tr className="border-y border-[#E2E8F0] text-left font-bold sm:border">
							<th className="px-8 py-4 text-center">#</th>
							<th className="px-8 py-4">Name</th>
							<th className="px-8 py-4">Miles</th>
						</tr>
					</thead>
					<tbody>
						{dataAvailable &&
							getUsers.data.usersToMiles.map((user, index) => {
								return (
									<tr
										key={user.id}
										className="border-b border-[#E2E8F0] sm:border"
									>
										<td className="w-16 px-8 py-4">
											{index == 0 ? (
												<FirstPlaceSVG />
											) : (
												<p className="text-center">{index + 1}</p>
											)}
										</td>
										<td>
											<Link
												href={`/profile/${user.id}`}
												className="mx-8 my-4 flex items-center gap-4 hover:text-blue-700"
											>
												<Image
													src={user.image!}
													alt={"Profile Picture"}
													width={49}
													height={49}
													className="hidden rounded-full sm:block"
												/>
												<p className="text-left">{user.name}</p>
											</Link>
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
			className="flex items-center gap-2 py-4 px-10 font-medium hover:text-blue-700"
			onClick={() => {
				signOut({ callbackUrl: "/" });
			}}
		>
			<LogOutSVG />
			{"Log Out"}
		</button>
	);
};

const LogOutSVG = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
			<polyline points="16 17 21 12 16 7"></polyline>
			<line x1="21" y1="12" x2="9" y2="12"></line>
		</svg>
	);
};

const FirstPlaceSVG = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"></path>
			<path d="M11 12 5.12 2.2"></path>
			<path d="m13 12 5.88-9.8"></path>
			<path d="M8 7h8"></path>
			<circle cx="12" cy="17" r="5"></circle>
			<path d="M12 18v-2h-.5"></path>
		</svg>
	);
};
