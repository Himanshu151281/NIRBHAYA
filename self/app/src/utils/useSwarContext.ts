import { useContext } from "react";
import { SwarContext } from "../context/swarContext";

export const useSwarakhsha = () => {
  const ctx = useContext(SwarContext);
  if (!ctx) throw new Error("useBinFinder must be used inside BinFinderProvider");
  return ctx;
};