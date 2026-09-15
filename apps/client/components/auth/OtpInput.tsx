"use client";

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type Props = {
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  length?: number;
};

export function OtpInput({ value, onChange, disabled, length = 6 }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigit(index, "");
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, length - index).split("");
      const next = digits.slice();
      chars.forEach((c, offset) => {
        next[index + offset] = c;
      });
      onChange(next.join("").slice(0, length));
      const focusAt = Math.min(index + chars.length, length - 1);
      refs.current[focusAt]?.focus();
      return;
    }

    setDigit(index, cleaned);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      setDigit(index - 1, "");
      event.preventDefault();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
      event.preventDefault();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
      event.preventDefault();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusAt = Math.min(pasted.length, length) - 1;
    refs.current[Math.max(focusAt, 0)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 rounded-xl border border-border/70 bg-surface text-center text-lg font-semibold tracking-tight outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-14 sm:w-12 sm:text-xl"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
