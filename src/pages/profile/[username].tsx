import { GetServerSideProps } from "next";
import { getProfile, Profile } from "../../server/common/get-profile";

export default function TutorProfile({ profile }: { profile: Profile }) {
	const { name, image, runsByWeek } = profile;

	return (
		<>
			<div className="flex min-h-screen flex-col items-center justify-center">
				<p>Name: {name}</p>
			</div>
		</>
	);
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
	if (!params || !params.username) {
		return {
			redirect: {
				destination: "/dashboard",
				permanent: false,
			},
		};
	}

	let userId = params.username;

	if (Array.isArray(userId)) {
		userId = userId[0];
	}

	if (!userId) {
		return {
			redirect: {
				destination: "/dashboard",
				permanent: false,
			},
		};
	}

	const profile = await getProfile(userId);

	if (!profile) {
		return {
			redirect: {
				destination: "/dashboard",
				permanent: false,
			},
		};
	}

	return {
		props: {
			profile,
		},
	};
};
