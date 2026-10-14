import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { LearnPromo } from "@/components/sections/LearnPromo";
import { EraStrip } from "@/components/sections/EraStrip";
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
      <Navbar />
      <main>
        <Hero />
        <EraStrip />
        <LearnPromo />
        <WhoWeAre />
      </main>
      <Footer />
    </div>
  );
};
export default Page;
