import Hero from "@/sections/Hero";
import About from "@/sections/About";
import Skills from "@/sections/Skills";
import Projects from "@/sections/Projects";
import Journey from "@/sections/Journey";
import Strengths from "@/sections/Strengths";
import GraphSection from "@/sections/GraphSection";
import Contact from "@/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Journey />
      <About />
      <Skills />
      <Projects />
      <Strengths />
      <GraphSection />
      <Contact />
    </>
  );
}
