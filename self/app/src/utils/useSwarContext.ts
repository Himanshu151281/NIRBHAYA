import { useContext } from "react";
import { SwarContext } from "../context/swarContext";

export const useNirbhaya = () => {
  const ctx = useContext(SwarContext);
  if (!ctx) throw new Error("useNirbhaya must be used inside SwarProvider");
  return ctx;
};