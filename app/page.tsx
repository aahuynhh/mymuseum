import { HomeLoadingGate } from "@/components/landing/HomeLoadingGate";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MuseumStyles } from "@/components/landing/MuseumStyles";
import { CommunityMuseums } from "@/components/landing/CommunityMuseums";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/ui/SiteFooter";

export default function Home() {
  return (
    <HomeLoadingGate footer={<SiteFooter />}>
      <HowItWorks />
      <MuseumStyles />
      <CommunityMuseums />
      <FinalCta />
    </HomeLoadingGate>
  );
}
