import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { trpc } from "../../utils/trpc";
import "cal-sans";
import dayjs from "dayjs";

export default function ProfilePage() {
	const router = useRouter();
	let { uid } = router.query;

	if (Array.isArray(uid)) {
		uid = uid[0];
	}

	const { status } = useSession();
	const isUserSignedIn = status === "authenticated";

	const profileQuery = trpc.profile.getProfile.useQuery(
		{
			userId: uid!,
		},
		{
			enabled: !!uid,
			onSuccess: (data) => {
				if (!data) {
					router.replace("/");
				}
			},
		}
	);

	const profile = profileQuery.data;

	const [selectedWeek, setSelectedWeek] = useState(0);
	const [selectedYear, setSelectedYear] = useState(0);

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

	return (
		<>
			<NavBar isUserSignedIn={isUserSignedIn} />
			<div>
				{profile &&
					profile.runsByWeek &&
					Object.entries(profile.runsByWeek)
						.reverse()
						.map(([year, weeks]) => {
							return (
								<div key={year} className="">
									<div className="flex justify-center py-10 text-center md:py-24">
										<h3 className="text-center font-bold tracking-wide sm:text-3xl">
											{profile.name.split(" ")[0]} has moved{" "}
											<span className="underline">
												{Math.round(
													weeks.totalMilesYear * 100 + Number.EPSILON
												) / 100}
											</span>{" "}
											miles in {year}
										</h3>
									</div>
									<div className="sm:flex sm:justify-center">
										<div className="sm:inline-block sm:rounded-lg sm:border md:shadow-md">
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
																	weekObject.totalMilesWeek * 100 +
																		Number.EPSILON
																) / 100;
															return (
																<tr key={week} className={`flex flex-col`}>
																	<td
																		className={`${
																			selectedWeek === Number(week) &&
																			"font-semibold"
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
																						className="flex justify-between py-4 pl-6 hover:bg-[#f8f8f8]"
																					>
																						<div className="flex flex-col text-lg">
																							<p className="w-28 font-medium">
																								{run.activity}
																							</p>
																							<p className="w-28 text-sm">
																								{dayjs(run.date).format(
																									"MM/DD"
																								)}
																							</p>
																						</div>
																						<div className="flex">
																							<div className="flex items-center">
																								<p>{run.distance} mi</p>
																							</div>
																							<div className="w-[56px]">
																								<p></p>
																							</div>
																						</div>
																					</div>
																				);
																			})}
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
			</div>
		</>
	);
}

const NavBar = ({ isUserSignedIn }: { isUserSignedIn: boolean }) => {
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
