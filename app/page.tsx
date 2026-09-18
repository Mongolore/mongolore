import { Announcement } from "@/components/Announcement";
import { Navbar } from "@/components/Navbar";
import { Features } from "@/components/sections/Features";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { WhatWeDo } from "@/components/sections/WhatWeDo";
import { WhoWeAre } from "@/components/sections/WhoWeAre";

const Page = () => {
  return (
    <div id="top">
      <a
        href="#map"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-navy-950"
      >
        Газрын зураг руу шилжих
      </a>
      <Announcement />
      <Navbar />
      <main>
        <Hero />
        <WhoWeAre />
        <WhatWeDo />
        <Features />
      </main>
      <Footer />
    </div>
  );
};
export default Page;
