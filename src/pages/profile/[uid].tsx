import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { trpc } from "../../utils/trpc";
import "cal-sans";
import Head from "next/head";
import HistoryPage from "../history";
import Image from "next/image";

export default function ProfilePage() {
	const router = useRouter();
	let { uid } = router.query;

	if (Array.isArray(uid)) {
		uid = uid[0];
	}

	const session = useSession();
	const isUserSignedIn = session.status === "authenticated";

	if (session.data?.user?.id === uid) {
		return <HistoryPage />;
	} else {
		return <PublicProfile isUserSignedIn={isUserSignedIn} uid={uid} />;
	}
}

function PublicProfile({
	isUserSignedIn,
	uid,
}: {
	isUserSignedIn: boolean;
	uid: string | undefined;
}) {
	const router = useRouter();

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

	return (
		<>
			<Head>
				<title>
					{(profile && profile.name) || "Profile"} - XM AROUND THE WORLD
				</title>
			</Head>
			<NavBar isUserSignedIn={isUserSignedIn} />
			<div>
				{profile &&
					profile.runsByWeek &&
					Object.entries(profile.runsByWeek)
						.reverse()
						.map(([year, weeks]) => {
							return (
								<div key={year} className="">
									<div className="flex flex-col items-center justify-center gap-6 py-10 text-center md:py-20">
										<Image
											src={profile.image}
											width={96}
											height={96}
											alt={"Profile Picture"}
											className={
												"hidden rounded-full outline outline-2 outline-offset-2 outline-blue-700 sm:block"
											}
										/>
										<Image
											src={profile.image}
											width={64}
											height={64}
											alt={"Profile Picture"}
											className={
												"rounded-full outline outline-2 outline-offset-2 outline-blue-700 sm:hidden"
											}
										/>
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
													<tr className="flex border-b border-black py-6 pl-7 text-xl font-bold">
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
																	<td className="flex items-center justify-between px-6 py-4 text-xl">
																		<p className="w-28 text-start">
																			Week {week}
																		</p>

																		<p className="w-32 text-end">
																			{totalMilesWeek} mi
																		</p>
																	</td>
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
			<div className="relative border-b shadow-sm">
				<div className="p-4">
					{isUserSignedIn ? (
						<>
							<div className="hidden h-[32.73px] md:flex md:justify-between">
								<HomeNavButton />
								<div className="hidden md:flex">
									<HistoryNavButton />
									<SignOutButton />
								</div>
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
						<div className="flex items-center justify-between">
							<HomeNavButton />
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
							<HomeNavButton />
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
			className="flex items-center gap-2 px-6 text-sm font-medium hover:text-blue-700"
			onClick={() => {
				signOut({ callbackUrl: "/" });
			}}
		>
			<LogOutSVG />
			{"Log Out"}
		</button>
	);
};

const HomeNavButton = () => {
	return (
		<Link
			href="/"
			className="flex items-center gap-2 px-6 text-sm	 font-medium hover:text-blue-700"
		>
			<HomeSVG />
			{"Home"}
		</Link>
	);
};

const HomeSVG = () => {
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
			<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
			<polyline points="9 22 9 12 15 12 15 22"></polyline>
		</svg>
	);
};

const HistoryNavButton = () => {
	return (
		<Link
			href="/history"
			className="flex items-center gap-2 px-6 text-sm font-medium hover:text-blue-700"
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
