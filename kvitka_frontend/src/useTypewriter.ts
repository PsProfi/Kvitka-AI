import { useState, useEffect } from "react";

interface TypewriterResult {
  displayed: string;
  done: boolean;
}

export function useTypewriter(text: string, speed: number = 18): TypewriterResult {
  const [displayed, setDisplayed] = useState<string>("");
  const [done, setDone] = useState<boolean>(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}
