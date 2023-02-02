import { GetServerSideProps } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { EARTH_CIRCUMFERENCE } from "../constants/constants";
import { getServerAuthSession } from "../server/common/get-server-auth-session";
import { trpc } from "../utils/trpc";
import { ChangeEvent, useState } from "react";
import "cal-sans";
import Link from "next/link";
import GoogleSignInButton from "../components/GoogleSignInButton";
import dayjs from "dayjs";
import Head from "next/head";

export default function Dashboard() {
	const { data: session, status } = useSession();
	const getUsers = trpc.user.getAllUsersAndMiles.useQuery();
	const utils = trpc.useContext();
	const [isSubmitted, setIsSubmitted] = useState(false);
	const setRun = trpc.run.setRun.useMutation({
		onMutate: async (newRun) => {
			setIsSubmitted(true);
			setTimeout(() => {
				setIsSubmitted(false);
			}, 3000);
			await utils.user.getAllUsersAndMiles.cancel();
			const previousUsers = getUsers.data;

			utils.user.getAllUsersAndMiles.setData(undefined, (prev) => {
				if (!prev) {
					return {
						totalMiles: newRun.distance,
						usersToMiles: [
							{
								id: newRun.userId,
								image: session?.user!.image!,
								name: session?.user!.name!,
								miles: newRun.distance,
							},
						],
					};
				}
				prev.totalMiles += newRun.distance;
				prev.usersToMiles.forEach((user) => {
					if (user.id === newRun.userId) {
						user.miles += newRun.distance;
					}
				});
				return prev;
			});

			return { previousUsers };
		},
		onError: (err, newRun, context) => {
			utils.user.getAllUsersAndMiles.setData(undefined, context!.previousUsers);
			setIsSubmitted(false);
		},
		onSettled: () => {
			utils.user.getAllUsersAndMiles.invalidate();
			setMilesInput(null);
			setActivityInput("");
		},
	});

	const isUserSignedIn = status === "authenticated";
	const isLoading = status === "loading";
	const dataAvailable = !getUsers.isLoading && getUsers.data;
	const percentageOfGoal = dataAvailable
		? (getUsers.data.totalMiles / EARTH_CIRCUMFERENCE) * 100
		: 0;

	const percentageOfGoalQuarter = dataAvailable
		? (getUsers.data.totalMiles / (EARTH_CIRCUMFERENCE / 4)) * 100
		: 0;

	const roundedPercentageOfGoal =
		Math.round(percentageOfGoal * 100 + Number.EPSILON) / 100;

	const roundedPercentageOfGoalQuarter =
		Math.round(percentageOfGoalQuarter * 100 + Number.EPSILON) / 100;

	const [milesInput, setMilesInput] = useState<number | null>(null);
	const [activityInput, setActivityInput] = useState("");
	const [selectedActivityOption, setSelectedActivityOption] = useState<
		"miles" | "steps" | null
	>("miles");

	const handleSelectActivityOptions = (e: ChangeEvent<HTMLSelectElement>) => {
		if (e.target.value === "miles" || e.target.value === "steps") {
			setSelectedActivityOption(e.target.value);
		}
	};

	const handleSubmitMove = async () => {
		if (!isUserSignedIn) {
			await signIn("google", {
				callbackUrl: `/`,
			});
		} else {
			if (
				milesInput === null ||
				milesInput <= 0 ||
				activityInput === "" ||
				selectedActivityOption === null
			) {
				return;
			}

			const distance =
				selectedActivityOption === "miles" ? milesInput : milesInput / 2000;
			const steps =
				selectedActivityOption === "steps" ? milesInput : milesInput * 2000;

			setRun.mutate({
				userId: session!.user!.id,
				distance,
				steps,
				activity: activityInput,
				date: dayjs().toISOString(),
			});
		}
	};

	const handleSubmitMoveKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Enter") {
			handleSubmitMove();
		}
	};

	return (
		<>
			<Head>
				<title>Leaderboard</title>
			</Head>
			{!isLoading && (
				<NavBar
					isUserSignedIn={isUserSignedIn}
					userName={session?.user?.name?.split(" ")[0] ?? ""}
				/>
			)}
			<div className="flex flex-col items-center justify-center py-10 text-center md:py-20">
				<h1 className="max-w-sm text-4xl text-[#111111] sm:max-w-lg md:max-w-4xl">
					We have collectively moved{" "}
					<span className="underline">
						{dataAvailable ? getUsers.data.totalMiles : 0}
					</span>{" "}
					miles
				</h1>
				<h5 className="max-w-sm text-[#111111] sm:max-w-lg md:max-w-4xl">
					<span className="font-bold">{roundedPercentageOfGoal}%</span> of the
					way around the earth
				</h5>
				<h5 className="max-w-sm text-[#111111] sm:max-w-lg md:max-w-4xl">
					And{" "}
					<span className="font-bold">{roundedPercentageOfGoalQuarter}%</span>{" "}
					of our goal for this quarter
				</h5>
			</div>
			{!isSubmitted ? (
				<div className="flex items-center justify-center">
					<div className="flex w-[600px] flex-col items-center">
						<div className="py-2">
							How many miles did you move today, and how?
						</div>
						<div className="flex w-[300px] flex-col items-center gap-3 py-2 sm:w-[370px] sm:flex-row sm:justify-between">
							<input
								type="text"
								placeholder="Activity"
								value={activityInput}
								className="w-[180px] rounded-md border py-2 px-4 shadow-inner focus:outline focus:outline-1 focus:outline-blue-700"
								maxLength={30}
								onChange={(e) => {
									setActivityInput(e.target.value);
								}}
								onKeyDown={handleSubmitMoveKeyDown}
							/>
							<div className="flex gap-1">
								<input
									className="w-24 rounded-md border py-2 px-4 text-end shadow-inner focus:outline focus:outline-1 focus:outline-blue-700"
									type="number"
									min={0}
									step={0.01}
									placeholder="0"
									value={milesInput ?? ""}
									onChange={(e) => {
										setMilesInput(
											Math.round(
												parseFloat(e.target.value) * 100 + Number.EPSILON
											) / 100
										);
									}}
									onKeyDown={handleSubmitMoveKeyDown}
								/>
								<select
									value={selectedActivityOption ?? "miles"}
									onChange={handleSelectActivityOptions}
									className="block w-20 appearance-none rounded border py-2 text-center leading-tight  hover:border-blue-700 focus:outline focus:outline-1 focus:outline-blue-700"
								>
									<option value={"miles"}>{"miles"}</option>
									<option value={"steps"}>{"steps"}</option>
								</select>
							</div>
						</div>
						<button
							className="w-20 py-2 hover:font-bold hover:text-blue-700"
							onClick={() => {
								handleSubmitMove();
							}}
						>
							Submit
						</button>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 py-8 sm:flex-row">
					<div>
						Thanks for your contribution! <span>🎉</span>
					</div>
				</div>
			)}
			<div className="py-10 sm:flex sm:justify-center">
				<div className="border sm:inline-block sm:rounded-lg sm:shadow-md">
					<table className="w-full select-none text-[#111111] sm:w-[600px]">
						<thead>
							<tr className="text-left font-bold">
								<th className="px-8 py-4 text-center">#</th>
								<th className="px-8 py-4">Name</th>
								<th className="px-8 py-4">Miles</th>
							</tr>
						</thead>
						<tbody>
							{dataAvailable &&
								getUsers.data.usersToMiles.map((user, index) => {
									return (
										<tr key={user.id} className="">
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
			</div>
			<div className="fixed bottom-3 pl-1 text-sm">
				{roundedPercentageOfGoal + "%"}
			</div>
			<div className="fixed bottom-0 h-3 w-full bg-[#E2E8F0] shadow-inner">
				<div
					className="flex h-3 items-center justify-center bg-blue-700 p-0.5 text-xs font-medium leading-none text-white"
					style={{ width: `${roundedPercentageOfGoal}%` }}
				></div>
			</div>
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

	const [isWelcomeMessageClicked, setIsWelcomeMessageClicked] = useState(false);
	const toggleWelcomeMessage = () => {
		setIsWelcomeMessageClicked(!isWelcomeMessageClicked);
	};

	return (
		<nav>
			<div className="relative border-b shadow-sm">
				<div className="p-4 md:p-6">
					{isUserSignedIn ? (
						<div className="flex items-center justify-between">
							<button
								onClick={() => {
									toggleWelcomeMessage();
								}}
							>
								<h5
									className={`${
										isWelcomeMessageClicked ? "hidden" : "hover:text-blue-700"
									}`}
								>
									<span className="hidden sm:inline-block">
										{"Welcome back, "}
									</span>
									<span className="inline-block sm:hidden">{"Hi, "}</span>
									<span className="font-bold">{` ${userName}!`}</span>
									<span className="text-2xl">👋</span>
								</h5>
								<h5 className={`${isWelcomeMessageClicked ? "" : "hidden"}`}>
									<span className="text-2xl">🏃</span>
								</h5>
							</button>
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
						<div className="flex flex-col items-center justify-center gap-6 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] py-6 shadow-md">
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
			className="flex items-center gap-2 px-6 font-medium hover:text-blue-700"
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
		<Link
			href="/history"
			className="flex items-center gap-2 px-6 font-medium hover:text-blue-700"
		>
			<HistorySVG />
			{"History"}
		</Link>
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
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
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
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="18" y1="6" x2="6" y2="18"></line>
			<line x1="6" y1="6" x2="18" y2="18"></line>
		</svg>
	);
};
