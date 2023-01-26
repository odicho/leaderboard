import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { trpc } from "../../utils/trpc";
import "cal-sans";

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

	return (
		<>
			<NavBar isUserSignedIn={isUserSignedIn} />
			<div>
				{profile &&
					profile.runsByWeek &&
					Object.entries(profile.runsByWeek).map(([year, weeks]) => {
						return (
							<div key={year} className="">
								<div className="flex justify-center py-10 text-center md:py-20">
									<h3 className="max-w-sm text-center text-3xl font-bold tracking-wide md:max-w-md md:text-4xl">
										{profile.name.split(" ")[0] ?? ""}
										{" has moved"}{" "}
										<span className="underline">{weeks.totalMilesYear}</span>{" "}
										miles in {year}
									</h3>
								</div>
								<div className="md:flex md:justify-center">
									<div className="md:rounded-lg md:border md:shadow-md">
										<div className="flex items-end justify-between border-b border-black py-6 px-7 text-xl font-bold">
											<p>{year}</p>
											<p>{"miles"}</p>
										</div>

										{Object.entries(weeks.week).map(([week, weekObject]) => {
											const totalMilesWeek =
												Math.round(
													weekObject.totalMilesWeek * 100 + Number.EPSILON
												) / 100;
											return (
												<div key={week} className="border-b">
													<div className="flex justify-between gap-2 px-7 py-2 text-xl hover:bg-[#f8f8f8] md:py-6">
														<p>Week {week}</p>
														<div className="md:w-80"></div>
														<p>{totalMilesWeek}</p>
													</div>
												</div>
											);
										})}
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
