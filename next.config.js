/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		appDir: false,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.googleusercontent.com",
			},
		],
		unoptimized: true,
	},
};

module.exports = nextConfig;

