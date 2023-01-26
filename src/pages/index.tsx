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
			<NavBar
				isUserSignedIn={isUserSignedIn}
				userName={session?.user?.name?.split(" ")[0] ?? ""}
			/>
			<div className="flex justify-center py-10 text-center md:py-24">
				<h1 className="max-w-sm text-4xl text-[#111111] sm:max-w-lg">
					We have collectively moved{" "}
					<span className="underline">
						{dataAvailable ? getUsers.data.totalMiles : 0}
					</span>{" "}
					miles
				</h1>
			</div>
			<div className="flex flex-col items-center justify-center gap-4 py-4 sm:flex-row">
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
		</>
	);
}

const NavBar = ({
	isUserSignedIn,
	userName,
}: {
	isUserSignedIn: boolean;
	userName: string;
}) => {
	const [mobileNavActive, setMobileNavActive] = useState(false);
	const toggleMobileNav = () => {
		setMobileNavActive(!mobileNavActive);
	};

	return (
		<nav>
			<div className="relative border-b">
				<div className="p-4 md:p-6">
					{isUserSignedIn ? (
						<div className="flex items-center justify-between">
							<h5>
								<span className="hidden sm:inline-block">
									{"Welcome back, "}
								</span>
								<span className="inline-block sm:hidden">{"Hi, "}</span>
								<span className="font-bold">{` ${userName}!`}</span>
								<span className="text-2xl">👋</span>
							</h5>
							<div className="hidden md:flex">
								<HistoryNavButton />
								<SignOutButton />
							</div>

							<div className="flex md:hidden">
								<button
									className={mobileNavActive ? "hidden" : "hover:text-blue-700"}
									onClick={() => toggleMobileNav()}
								>
									<HamburgerIcon />
								</button>
								<button
									className={mobileNavActive ? "hover:text-blue-700" : "hidden"}
									onClick={() => toggleMobileNav()}
								>
									<CrossIcon />
								</button>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-end">
							<GoogleSignInButton />
						</div>
					)}
				</div>
				<div
					className={
						mobileNavActive
							? "absolute inset-x-2 z-10 pt-2 md:hidden"
							: "hidden"
					}
				>
					{isUserSignedIn && (
						<div className="flex flex-col items-center justify-center gap-6 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] py-4 shadow-md">
							<HistoryNavButton />
							<SignOutButton />
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};

const SignOutButton = () => {
	return (
		<button
			className="flex items-center gap-2 px-10 font-medium hover:text-blue-700"
			onClick={() => {
				signOut({ callbackUrl: "/" });
			}}
		>
			<LogOutSVG />
			{"Log Out"}
		</button>
	);
};

const HistoryNavButton = () => {
	return (
		<button
			className="flex items-center gap-2 px-10 font-medium hover:text-blue-700"
			onClick={() => {}}
		>
			<HistorySVG />
			{"History"}
		</button>
	);
};

const HistorySVG = () => {
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
			<path d="M3 3v5h5"></path>
			<path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
			<path d="M12 7v5l4 2"></path>
		</svg>
	);
};

const LogOutSVG = () => {
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

const HamburgerIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<line x1="4" y1="12" x2="20" y2="12"></line>
			<line x1="4" y1="6" x2="20" y2="6"></line>
			<line x1="4" y1="18" x2="20" y2="18"></line>
		</svg>
	);
};

const CrossIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<line x1="18" y1="6" x2="6" y2="18"></line>
			<line x1="6" y1="6" x2="18" y2="18"></line>
		</svg>
	);
};
