import dayjs, { Dayjs } from "dayjs";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { trpc } from "../../utils/trpc";
import "cal-sans";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { RunsByWeek } from "../../server/common/get-profile";
import Head from "next/head";
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

	const deleteRun = trpc.run.deleteRun.useMutation({
		onMutate: async (deletedRun) => {
			await utils.profile.getProfile.cancel();
			const previousUsers = profileQuery.data;

			utils.profile.getProfile.setData({ userId }, (prev) => {
				const year = selectedYear;
				const week = selectedWeek;
				if (!prev) {
					return prev;
				}
				prev.runsByWeek[year].totalMilesYear -= deletedRun.distance;
				prev.runsByWeek[year].week[week].totalMilesWeek -= deletedRun.distance;
				prev.runsByWeek[year].week[week].runs = prev.runsByWeek[year].week[
					week
				].runs.filter((run) => run.id !== deletedRun.id);
				return prev;
			});

			return { previousUsers };
		},
		onError: (err, newRun, context) => {
			utils.profile.getProfile.setData({ userId }, context!.previousUsers);
			setIsSubmitted(false);
		},
		onSettled: () => {
			utils.profile.getProfile.invalidate();
		},
	});

	const [isSubmitted, setIsSubmitted] = useState(false);
	const utils = trpc.useContext();
	const setRun = trpc.run.setRun.useMutation({
		onMutate: async (newRun) => {
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
			utils.profile.getProfile.invalidate();
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
	const [selectedYear, setSelectedYear] = useState(0);
	const [selectedActivityOption, setSelectedActivityOption] = useState<
		"miles" | "steps" | null
	>(null);

	const handleSelectActivityOptions = (e: ChangeEvent<HTMLSelectElement>) => {
		if (e.target.value === "miles" || e.target.value === "steps") {
			setSelectedActivityOption(e.target.value);
		}
	};

	const handleWeekClick = (week: number) => {
		if (week === selectedWeek) {
			setSelectedWeek(0);
			return;
		}
		setSelectedWeek(week);
	};

	const handleYearClick = (year: number) => {
		setSelectedYear(year);
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
		setSelectedActivityOption("miles");
		setMilesInput(0);
	};

	const handleSubmit = () => {
		if (
			milesInput === null ||
			milesInput <= 0 ||
			selectedDate === null ||
			selectedWeek === 0 ||
			activityInput === "" ||
			selectedActivityOption === null
		) {
			return;
		}

		setRun.mutate({
			userId: session!.user!.id,
			distance:
				selectedActivityOption === "miles" ? milesInput : milesInput / 2000,
			activity: activityInput,
			date: selectedDate.toISOString(),
		});
	};

	const handleDeleteRun = (id: string, distance: number) => {
		if (profile === undefined) return;
		if (id === "" || id === undefined) return;
		deleteRun.mutate({ id, distance });
	};

	return (
		<>
			<Head>
				<title>History</title>
			</Head>
			<NavBar
				isUserSignedIn={isUserSignedIn}
				userName={session?.user?.name?.split(" ")[0] ?? ""}
			/>

			{profile &&
				profile.runsByWeek &&
				Object.entries(profile.runsByWeek)
					.reverse()
					.map(([year, weeks]) => {
						return (
							<div key={year} className="">
								<div className="flex justify-center py-10 text-center md:py-24">
									<h3 className="text-center font-bold tracking-wide sm:text-3xl">
										{"You have moved"}{" "}
										<span className="underline">
											{Math.round(weeks.totalMilesYear * 100 + Number.EPSILON) /
												100}
										</span>{" "}
										miles in {year}
									</h3>
								</div>
								<div className="sm:flex sm:justify-center">
									<div className="sm:inline-block sm:rounded-lg sm:border sm:shadow-md">
										<table className="w-full select-none sm:w-[600px]">
											<thead>
												<tr className="flex border-b border-black py-6 pl-7 pr-20 text-xl font-bold">
													<th>{year}</th>
												</tr>
											</thead>

											<tbody>
												{Object.entries(weeks.week)
													.reverse()
													.map(([week, weekObject]) => {
														const totalMilesWeek =
															Math.round(
																weekObject.totalMilesWeek * 100 + Number.EPSILON
															) / 100;
														return (
															<tr key={week} className={`flex flex-col`}>
																<td
																	className={`${
																		selectedWeek === Number(week) &&
																		"border-b font-semibold"
																	} flex cursor-pointer items-center justify-between text-xl hover:bg-[#f8f8f8]`}
																	onClick={() => {
																		handleWeekClick(Number(week));
																		handleYearClick(Number(year));
																	}}
																>
																	<div className="py-4 pl-6">
																		<p className="w-28 text-start">
																			Week {week}
																		</p>
																	</div>
																	<div className="flex">
																		<div>
																			<p className="w-32 text-end">
																				{totalMilesWeek} mi
																			</p>
																		</div>

																		<div className="px-4 sm:px-10">
																			<div className="flex justify-center">
																				{selectedWeek === Number(week) ? (
																					<ArrowDownIcon />
																				) : (
																					<ArrowUpIcon />
																				)}
																			</div>
																		</div>
																	</div>
																</td>

																{selectedWeek === Number(week) && (
																	<td className="flex flex-col border-b">
																		{weekObject.runs.map((run, index) => {
																			return (
																				<div
																					key={index}
																					className="flex justify-between border-b py-4 hover:bg-[#f8f8f8]"
																				>
																					<div className="flex flex-col pl-6 text-lg">
																						<p className="w-28 font-medium">
																							{run.activity}
																						</p>
																						<p className="w-28 text-sm">
																							{dayjs(run.date).format("MM/DD")}
																						</p>
																					</div>
																					<div className="flex items-center">
																						<p>{run.distance} mi</p>
																						<div className="px-4 sm:px-10">
																							<button
																								onClick={() =>
																									handleDeleteRun(
																										run.id,
																										run.distance
																									)
																								}
																							>
																								<TrashCanIcon />
																							</button>
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
																				} hover:text-blue-700`}
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
																						<div className="flex flex-col gap-3 px-6 text-lg">
																							<div className="flex w-full flex-col gap-4 sm:flex-row">
																								{" "}
																								<input
																									type="text"
																									placeholder="Activity"
																									value={activityInput}
																									className="w-[164px] rounded-md border px-4 py-2 shadow-inner focus:outline focus:outline-1 focus:outline-blue-700"
																									maxLength={30}
																									onChange={(e) => {
																										setActivityInput(
																											e.target.value
																										);
																									}}
																								/>
																								<div className="flex gap-1">
																									<input
																										className="w-20 rounded-md border py-1 pr-3 text-end shadow-inner focus:outline focus:outline-1 focus:outline-blue-700"
																										type="number"
																										placeholder={"0"}
																										min={0}
																										step={0.01}
																										value={milesInput || ""}
																										onChange={(e) => {
																											setMilesInput(
																												Math.round(
																													parseFloat(
																														e.target.value
																													) *
																														100 +
																														Number.EPSILON
																												) / 100
																											);
																										}}
																									/>
																									<select
																										value={
																											selectedActivityOption ??
																											"miles"
																										}
																										onChange={
																											handleSelectActivityOptions
																										}
																										className="block w-20 appearance-none rounded border py-2 text-center leading-tight  hover:border-blue-700 focus:outline focus:outline-1 focus:outline-blue-700"
																									>
																										<option value={"miles"}>
																											{"miles"}
																										</option>
																										<option value={"steps"}>
																											{"steps"}
																										</option>
																									</select>
																								</div>
																							</div>
																							<select
																								value={selectedDate?.format(
																									"YYYY-MM-DD"
																								)}
																								onChange={(e) =>
																									setSelectedDate(
																										dayjs(e.target.value)
																									)
																								}
																								className="block w-[164px] appearance-none rounded border py-2 pl-4 pr-8 leading-tight hover:border-blue-700 focus:outline focus:outline-1 focus:outline-blue-700 "
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
																										{option.format(
																											"YYYY-MM-DD"
																										)}
																									</option>
																								))}
																							</select>
																						</div>
																						<div className="flex items-center">
																							<div className="flex px-10">
																								<button
																									onClick={() => handleSubmit()}
																									className="hover:text-blue-700 focus:outline focus:outline-1 focus:outline-blue-700"
																								>
																									<CheckMarkIcon />
																								</button>
																							</div>
																						</div>
																					</>
																				)}
																		</div>
																	</td>
																)}
															</tr>
														);
													})}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						);
					})}
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
		<div className="flex h-6 w-6 items-center justify-center">
			{" "}
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
		</div>
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
