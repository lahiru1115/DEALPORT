import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
      Three hosts, each for a different reason:
       - `res.cloudinary.com` — real product images uploaded through
         `POST /uploads/image` (see plans/02-API.md §5).
       - `picsum.photos` / `i.pravatar.cc` — the placeholder product and avatar
         images the seed uses, so a freshly seeded database renders a populated
         UI without anyone having to upload anything first.
    */
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
