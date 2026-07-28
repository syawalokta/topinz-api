"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Normalize any phone-ish string to local digits (without the +62 prefix):
 * strips non-digits, a leading "62" country code, and leading zeros.
 * Capped at 13 digits (server rule: `^\+62\d{8,13}$`).
 */
export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  while (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 13);
}

interface PhoneInputProps {
  id?: string;
  /** Local digits only, without the +62 prefix. */
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

/** Composed Indonesian phone control: fixed "+62" addon + numeric input. */
export function PhoneInput({
  id,
  value,
  onChange,
  placeholder = "81234567890",
  disabled,
  autoComplete = "tel-national",
  className,
}: PhoneInputProps) {
  return (
    <div className={cn("flex", className)}>
      <span className="flex select-none items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground shadow-sm">
        +62
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(normalizePhoneDigits(e.target.value))}
        placeholder={placeholder}
        className="rounded-l-none"
      />
    </div>
  );
}
