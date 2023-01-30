import dayjs, { Dayjs } from "dayjs";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { trpc } from "../../utils/trpc";
import "cal-sans";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { RunsByWeek } from "../../server/common/get-profile";
dayjs.extend(weekOfYear);

export default function HistoryPage() {
	const router = useRouter();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.replace("/");
		},
	});
	const isUserSignedIn = status === "authenticated";
	const userId = session?.user?.id!;

	const profileQuery = trpc.profile.getProfile.useQuery(
		{
			userId: userId,
		},
		{
			enabled: !!userId,
		}
	);

	const [isSubmitted, setIsSubmitted] = useState(false);
	const utils = trpc.useContext();
	const setRun = trpc.run.setRun.useMutation({
		onMutate: async (newRun) => {
			// setIsSubmitted(true);
			// setTimeout(() => {
			// 	setIsSubmitted(false);
			// }, 3000);
			await utils.profile.getProfile.cancel();
			const previousUsers = profileQuery.data;

			utils.profile.getProfile.setData({ userId }, (prev) => {
				const year = Number(dayjs(newRun.date).format("YYYY"));
				const week = dayjs(newRun.date).week();
				if (!prev) {
					const returnObject = {
						id: userId,
						image: session?.user?.image ?? "",
						name: session?.user?.name ?? "",
						runsByWeek: {} as RunsByWeek,
					};

					returnObject.runsByWeek[year] = {
						week: {},
						totalMilesYear: newRun.distance,
					};
					returnObject.runsByWeek[year].week[week] = {
						runs: [{ ...newRun, id: "" }],
						totalMilesWeek: newRun.distance,
					};

					return returnObject;
				}
				prev.runsByWeek[year].totalMilesYear += newRun.distance;
				prev.runsByWeek[year].week[week].totalMilesWeek += newRun.distance;
				prev.runsByWeek[year].week[week].runs.push({ ...newRun, id: "" });
				prev.runsByWeek[year].week[week].runs.sort((a, b) => {
					return dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1;
				});
				return prev;
			});

			return { previousUsers };
		},
		onError: (err, newRun, context) => {
			utils.profile.getProfile.setData({ userId }, context!.previousUsers);
			setIsSubmitted(false);
		},
		onSettled: () => {
			utils.user.getAllUsersAndMiles.invalidate();
			setActivityInput("");
			setMilesInput(0);
			setSelectedDate(null);
			setDateOptions([]);
			setCreateNew(false);
			setCreateNewWeek(0);
		},
	});

	const profile = profileQuery.data;

	const [createNew, setCreateNew] = useState(false);
	const [createNewWeek, setCreateNewWeek] = useState(0);
	const [milesInput, setMilesInput] = useState<number | null>(null);
	const [activityInput, setActivityInput] = useState("");
	const [dateOptions, setDateOptions] = useState<Dayjs[]>([]);
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const [selectedWeek, setSelectedWeek] = useState(0);

	const handleWeekClick = (week: number) => {
		if (week === selectedWeek) {
			setSelectedWeek(0);
			return;
		}
		setSelectedWeek(week);
	};

	const handleCreateNew = (week: number, year: number) => {
		setCreateNew(true);

		const firstDayOfWeek = dayjs().year(year).week(week).startOf("week");
		const daysOfWeek = [];
		for (let i = 0; i < 7; i++) {
			daysOfWeek.push(firstDayOfWeek.add(i, "day"));
		}
		setDateOptions(daysOfWeek);
		setSelectedDate(daysOfWeek[0]);
		setCreateNewWeek(week);
		setActivityInput("");
		setMilesInput(0);
	};

	const handleSubmit = () => {
		if (
			milesInput === null ||
			milesInput <= 0 ||
			selectedDate === null ||
			selectedWeek === 0 ||
			activityInput === ""
		) {
			return;
		}
		setRun.mutate({
			userId: session!.user!.id,
			distance: milesInput,
			activity: activityInput,
			date: selectedDate.toISOString(),
		});
	};

	return (
		<>
			<NavBar
				isUserSignedIn={isUserSignedIn}
				userName={session?.user?.name?.split(" ")[0] ?? ""}
			/>
			<div>
				{profile &&
					profile.runsByWeek &&
					Object.entries(profile.runsByWeek).map(([year, weeks]) => {
						return (
							<div key={year} className="">
								<div className="flex justify-center py-10 text-center md:py-24">
									<h3 className="text-center font-bold tracking-wide sm:text-3xl">
										{"You have moved"}{" "}
										<span className="underline">{weeks.totalMilesYear}</span>{" "}
										miles in {year}
									</h3>
								</div>
								<table className="w-full md:flex md:justify-center">
									<div className="md:rounded-lg md:border md:shadow-md">
										<thead>
											<tr className="flex border-b border-black py-6 pl-7 pr-20 text-xl font-bold">
												<th>{year}</th>
											</tr>
										</thead>

										<tbody>
											{Object.entries(weeks.week).map(([week, weekObject]) => {
												const totalMilesWeek =
													Math.round(
														weekObject.totalMilesWeek * 100 + Number.EPSILON
													) / 100;
												return (
													<tr key={week} className="border-b">
														<td>
															<button
																onClick={() => {
																	handleWeekClick(Number(week));
																}}
															>
																<div
																	className={`${
																		selectedWeek === Number(week) &&
																		"font-semibold"
																	} flex items-center text-xl hover:bg-[#f8f8f8]`}
																>
																	<td className="py-4 pl-6 pr-32">
																		<p className="w-28 text-start">
																			Week {week}
																		</p>
																	</td>
																	<td>
																		<p className="w-32 text-end">
																			{totalMilesWeek} mi
																		</p>
																	</td>
																	<td className="px-10">
																		<div className="flex justify-center">
																			{selectedWeek === Number(week) ? (
																				<ArrowDownIcon />
																			) : (
																				<ArrowUpIcon />
																			)}
																		</div>
																	</td>
																</div>
															</button>
															{selectedWeek === Number(week) && (
																<div className="flex flex-col">
																	{weekObject.runs.map((run) => {
																		return (
																			<div
																				key={run.id}
																				className="flex justify-between py-4 px-6 hover:bg-[#f8f8f8]"
																			>
																				<div className="flex flex-col text-lg">
																					<p className="w-28 font-medium">
																						{run.activity}
																					</p>
																					<p className="w-28 text-sm">
																						{dayjs(run.date).format("MM/DD")}
																					</p>
																				</div>
																				<div className="flex items-center">
																					<p>{run.distance} mi</p>
																					<div className="flex pl-4">
																						<div className="px-2">
																							<button>
																								<EditIcon />
																							</button>
																						</div>
																						<div className="px-2">
																							<button>
																								<TrashCanIcon />
																							</button>
																						</div>
																					</div>
																				</div>
																			</div>
																		);
																	})}
																	<div
																		className={`${
																			createNew &&
																			createNewWeek === Number(week)
																				? "justify-between"
																				: "justify-center"
																		} flex py-4`}
																	>
																		<button
																			className={`${
																				createNew &&
																				createNewWeek === Number(week)
																					? "hidden"
																					: ""
																			}`}
																			onClick={() => {
																				handleCreateNew(
																					Number(week),
																					Number(year)
																				);
																			}}
																		>
																			<PlusIcon />
																		</button>
																		{createNew &&
																			createNewWeek === Number(week) && (
																				<>
																					<div className="flex flex-col gap-4 px-6 text-lg">
																						<input
																							type="text"
																							placeholder="Activity"
																							value={activityInput}
																							className="w-44 rounded-md border p-1 px-4 shadow-inner focus:outline focus:outline-1 focus:outline-blue-700"
																							maxLength={30}
																							onChange={(e) => {
																								setActivityInput(
																									e.target.value
																								);
																							}}
																						/>
																						<select
																							value={selectedDate?.format(
																								"YYYY-MM-DD"
																							)}
																							onChange={(e) =>
																								setSelectedDate(
																									dayjs(e.target.value)
																								)
																							}
																							className="focus:shadow-outline block w-full appearance-none rounded border bg-white px-4 py-2 pr-8 leading-tight shadow hover:border-gray-500 focus:outline-none"
																						>
																							{dateOptions.map((option) => (
																								<option
																									key={option.format(
																										"YYYY-MM-DD"
																									)}
																									value={option.format(
																										"YYYY-MM-DD"
																									)}
																								>
																									{option.format("YYYY-MM-DD")}
																								</option>
																							))}
																						</select>
																					</div>
																					<div className="flex items-center">
																						<input
																							className="w-20 rounded-md border py-1 px-4 text-end shadow-inner focus:outline focus:outline-1 focus:outline-blue-700"
																							type="number"
																							placeholder={"0"}
																							min={0}
																							step={0.01}
																							value={milesInput || ""}
																							onChange={(e) => {
																								setMilesInput(
																									Math.round(
																										parseFloat(e.target.value) *
																											100 +
																											Number.EPSILON
																									) / 100
																								);
																							}}
																							// onKeyDown={handleSubmitMoveKeyDown}
																						/>
																						<div className="flex px-10">
																							<button
																								onClick={() => handleSubmit()}
																							>
																								<CheckMarkIcon />
																							</button>
																						</div>
																					</div>
																				</>
																			)}
																	</div>
																</div>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</div>
								</table>
							</div>
						);
					})}
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

	return (
		<nav>
			<div className="relative border-b">
				<div className="p-4 md:p-6">
					{isUserSignedIn ? (
						<>
							<div className="hidden md:flex md:justify-end">
								<LeaderboardNavButton />
								<SignOutButton />
							</div>
							<div className="flex items-center justify-end">
								<div className="flex md:hidden">
									<button
										className={
											mobileNavActive ? "hidden" : "hover:text-blue-700"
										}
										onClick={() => toggleMobileNav()}
									>
										<HamburgerIcon />
									</button>
									<button
										className={
											mobileNavActive ? "hover:text-blue-700" : "hidden"
										}
										onClick={() => toggleMobileNav()}
									>
										<CrossIcon />
									</button>
								</div>
							</div>
						</>
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
							<LeaderboardNavButton />
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

const LeaderboardNavButton = () => {
	return (
		<Link
			href="/"
			className="flex items-center gap-2 px-10 font-medium hover:text-blue-700"
		>
			<LeaderboardSVG />
			{"Leaderboard"}
		</Link>
	);
};

const LeaderboardSVG = () => {
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
			<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
			<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
			<path d="M4 22h16"></path>
			<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
			<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
			<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
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

const ArrowDownIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className="h-6 w-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M19.5 8.25l-7.5 7.5-7.5-7.5"
			/>
		</svg>
	);
};

const ArrowUpIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className="h-6 w-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4.5 15.75l7.5-7.5 7.5 7.5"
			/>
		</svg>
	);
};

const EditIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
			<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
		</svg>
	);
};

const TrashCanIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 6h18"></path>
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
			<line x1="10" y1="11" x2="10" y2="17"></line>
			<line x1="14" y1="11" x2="14" y2="17"></line>
		</svg>
	);
};

const PlusIcon = () => {
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
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
	);
};

const CheckMarkIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2}
			stroke="currentColor"
			className="h-6 w-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4.5 12.75l6 6 9-13.5"
			/>
		</svg>
	);
};
