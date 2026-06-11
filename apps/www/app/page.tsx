import { Nav } from "../components/landing/nav";
import { Hero } from "../components/landing/hero";
import { Gallery } from "../components/landing/gallery";
import { ProblemSolution } from "../components/landing/problem-solution";
import { Features } from "../components/landing/features";
import { WhiteLabel } from "../components/landing/white-label";
import { Variants } from "../components/landing/variants-section";
import { Process } from "../components/landing/process";
import { FinalCTA } from "../components/landing/final-cta";
import { Footer } from "../components/landing/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gallery />
        <ProblemSolution />
        <Features />
        <WhiteLabel />
        <Variants />
        <Process />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
