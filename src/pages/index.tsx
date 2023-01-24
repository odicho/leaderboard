import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Home() {
	return (
		<>
			<Head>
				<title>Tutor Pro - Tutor like a pro</title>
			</Head>
			<NavBar />
		</>
	);
}

const NavBar = () => {
	const [mobileNavActive, setMobileNavActive] = useState(false);
	const toggleMobileNav = () => {
		setMobileNavActive(!mobileNavActive);
	};

	return (
		<>
			<div className="mx-auto max-w-7xl px-4 md:px-0">
				<header className="relative">
					<nav className="flex justify-end py-4 md:justify-center">
						<div className="hidden md:flex">
							<GoogleSignInButton />
						</div>
						<div className="md:hidden">
							<button
								className={
									mobileNavActive
										? "hidden"
										: "align-middle text-white hover:text-[#02C39A]"
								}
								onClick={() => toggleMobileNav()}
							>
								<HamburgerIcon />
							</button>
							<button
								className={
									mobileNavActive
										? "align-middle text-white hover:text-[#02C39A]"
										: "hidden"
								}
								onClick={() => toggleMobileNav()}
							>
								<CrossIcon />
							</button>
						</div>
					</nav>
					<div
						className={
							mobileNavActive
								? "absolute inset-x-0 z-10 rounded-md border border-[#3F3F46] bg-[#27272A] md:hidden"
								: "hidden"
						}
					>
						<div className={"flex flex-col items-center md:hidden"}>
							<GoogleSignInButton />
						</div>
					</div>
				</header>
			</div>
		</>
	);
};

const NavLink = ({ navName, navRef }: { navName: string; navRef: string }) => {
	return (
		<Link
			className="py-4 px-10 font-medium text-white hover:text-[#02C39A]"
			href={navRef}
		>
			{navName}
		</Link>
	);
};

const HamburgerIcon = () => {
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
				d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
			/>
		</svg>
	);
};

const CrossIcon = () => {
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
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	);
};
