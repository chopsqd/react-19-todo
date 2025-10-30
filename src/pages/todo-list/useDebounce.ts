import { useRef } from "react";

export const useDebounce = (time: number) => {
  const ref = useRef(0);

  return (callback: () => void) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(callback, time);
  };
};
