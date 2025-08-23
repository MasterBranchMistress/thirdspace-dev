/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "i.pravatar.cc",
      "www.gravatar.com",
      "lumiere-a.akamaihd.net",
      "thirdspace-attachments-dev.s3.us-east-2.amazonaws.com",
    ],
  },
};

module.exports = nextConfig;
