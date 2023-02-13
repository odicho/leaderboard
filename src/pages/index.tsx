import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { EARTH_CIRCUMFERENCE } from "../constants/constants";
import { trpc } from "../utils/trpc";
import { ChangeEvent, useState } from "react";
import "cal-sans";
import Link from "next/link";
import GoogleSignInButton from "../components/GoogleSignInButton";
import dayjs from "dayjs";
import Head from "next/head";
import Calendar from "../components/Calendar";

export default function Dashboard() {
	const { data: session, status } = useSession();
	const getUsers = trpc.user.getAllusersAndSumDistance.useQuery();
	const [isSubmitted, setIsSubmitted] = useState(false);
	const utils = trpc.useContext();
	const setRun = trpc.run.setRun.useMutation({
		onMutate: async (newRun) => {
			setIsSubmitted(true);
			setTimeout(() => {
				setIsSubmitted(false);
			}, 3000);
			await utils.user.getAllUsersAndMiles.cancel();
			const previousUsers = getUsers.data;

			utils.user.getAllusersAndSumDistance.setData(undefined, (prev) => {
				if (!prev) {
					return {
						totalMiles: newRun.distance,
						totalMilesQuarter: newRun.distance,
						users: [
							{
								id: newRun.userId,
								name: session?.user!.name!,
								image: session?.user!.image!,
							},
						],
					};
				}
				prev.totalMiles += newRun.distance;
				prev.totalMilesQuarter += newRun.distance;
				return prev;
			});

			return { previousUsers };
		},
		onError: (err, newRun, context) => {
			utils.user.getAllusersAndSumDistance.setData(
				undefined,
				context!.previousUsers
			);
			setIsSubmitted(false);
		},
		onSettled: () => {
			utils.user.getAllusersAndSumDistance.invalidate();
			setMilesInput(null);
			setActivityInput("");
			setSelectedActivityOption("miles");
		},
	});

	const isUserSignedIn = status === "authenticated";
	const isLoading = status === "loading";
	const dataAvailable = !getUsers.isLoading && getUsers.data;
	const percentageOfGoal = dataAvailable
		? (getUsers.data.totalMiles / EARTH_CIRCUMFERENCE) * 100
		: 0;

	const percentageOfGoalQuarter = dataAvailable
		? (getUsers.data.totalMilesQuarter / (EARTH_CIRCUMFERENCE * 0.25)) * 100
		: 0;

	const roundedPercentageOfGoal =
		Math.round(percentageOfGoal * 100 + Number.EPSILON) / 100;

	const roundedPercentageOfGoalQuarter =
		Math.round(percentageOfGoalQuarter * 100 + Number.EPSILON) / 100;

	const [milesInput, setMilesInput] = useState<number | null>(null);
	const [activityInput, setActivityInput] = useState("");
	const [selectedActivityOption, setSelectedActivityOption] = useState<
		"miles" | "steps" | "calories"
	>("miles");
	const [selectedDate, setSelectedDate] = useState<string>(
		dayjs().tz("America/Los_Angeles").format("YYYY-MM-DD")
	);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleSelectActivityOptions = (e: ChangeEvent<HTMLSelectElement>) => {
		if (
			e.target.value === "miles" ||
			e.target.value === "steps" ||
			e.target.value === "calories"
		) {
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

			let distance: number;

			if (selectedActivityOption === "calories") {
				distance = milesInput / 100;
			} else if (selectedActivityOption === "steps") {
				distance = milesInput / 2000;
			} else {
				distance = milesInput;
			}

			const steps =
				selectedActivityOption === "steps" ? milesInput : milesInput * 2000;

			setRun.mutate({
				userId: session!.user!.id,
				distance,
				steps,
				activity: activityInput,
				date: dayjs(selectedDate).toISOString(),
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
				<title>Home - XM AROUND THE WORLD</title>
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
					<div className="flex w-full flex-col items-center sm:w-[600px]">
						<div className="flex flex-col items-center gap-3 py-2 sm:flex-row">
							<p className="sm:pr-1.5">Submit your movement </p>
							<div className="relative flex flex-col items-center pt-4 sm:pt-0">
								<button
									className="w-[180px] rounded border p-2 text-center hover:border-blue-700"
									onClick={() => setIsModalOpen(true)}
								>
									{dayjs(selectedDate).format("MMMM D, YYYY")}
								</button>
								{isModalOpen && (
									<Calendar
										selectedDate={selectedDate}
										setSelectedDate={setSelectedDate}
										onClose={() => setIsModalOpen(false)}
									/>
								)}
							</div>
						</div>
						<div className="flex w-[300px] flex-col items-center gap-3 py-2 sm:w-[370px] sm:flex-row sm:justify-between">
							<input
								type="text"
								placeholder="Activity"
								value={activityInput}
								className="w-[180px] rounded border py-2 px-4 focus:outline focus:outline-1 focus:outline-blue-700"
								maxLength={30}
								onChange={(e) => {
									setActivityInput(e.target.value);
								}}
								onKeyDown={handleSubmitMoveKeyDown}
							/>
							<div className="flex gap-1">
								<input
									className="w-24 rounded border py-2 px-4 text-end focus:outline focus:outline-1 focus:outline-blue-700"
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
									className="block w-20 rounded border text-center hover:border-blue-700 focus:outline focus:outline-1 focus:outline-blue-700"
								>
									<option value={"miles"}>{"miles"}</option>
									<option value={"steps"}>{"steps"}</option>
									<option value={"calories"}>{"calories"}</option>
								</select>
							</div>
						</div>
						<button
							className="w-20 py-2 hover:font-bold hover:text-blue-700 focus:text-blue-700"
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
			<div className="flex flex-col items-center justify-center px-4 pb-10 pt-20 text-[#111111] sm:px-10">
				<h1 className="pb-8 text-2xl">Our Lovely Team</h1>
				<div className="grid w-full gap-2 sm:w-fit sm:max-w-7xl sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
					{dataAvailable &&
						getUsers.data.users.map((user, index) => {
							return (
								<Link
									key={user.id}
									href={`/profile/${user.id}`}
									className="rounded border p-4 outline-none hover:border-blue-700/50 hover:text-blue-700 focus:border-blue-700/50 focus:text-blue-700"
								>
									<div className="flex items-center gap-4 sm:flex-col ">
										<Image
											src={user.image!}
											alt={"Profile Picture"}
											width={49}
											height={49}
											className="rounded-full"
										/>
										<p>{user.name}</p>
									</div>
								</Link>
							);
						})}
				</div>
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
				<div className="p-4">
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
			className="flex items-center gap-2 px-6 text-sm font-medium hover:text-blue-700 focus:text-blue-700"
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
			className="flex items-center gap-2 px-6 text-sm font-medium outline-none hover:text-blue-700 focus:text-blue-700"
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
			width="20"
			height="20"
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
