"use client";

import {
  FeatureHighlights,
  Footer,
  HeroSection,
  Nav,
  QuickActions, // don’t forget to import this if it’s in your components
} from "@/components/custom";
// import { SwarContext } from "@/context/swarContext";
// import { useRouter } from "next/navigation"; // ✅ Next.js hook
// import { useContext } from "react";

export default function HomePage() {
  // const swarContext = useContext(SwarContext);
  // const currentAccount = swarContext?.currentAccount;

  // useEffect(() => {
  //   console.log("Current Account:", currentAccount);
  //   if (!currentAccount) {
  //     // navigate to connect wallet page
  //     router.push("/connect");
  //   }
  // }, [currentAccount, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      <main className="pt-25">
        <HeroSection />
        <QuickActions />
        <FeatureHighlights />
      </main>

      <Footer />

      {/* If you want a fixed bottom bar */}
      {/* <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomBar />
      </div> */}
    </div>
  );
}
