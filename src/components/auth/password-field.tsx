"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authFormStyles } from "@/components/auth/auth-styles";
import { FieldError } from "@/components/ui/field-error";

interface PasswordFieldProps {
  id: string;
  label: string;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  /** Accessible label for the visibility toggle when the password is hidden. */
  showLabel?: string;
  /** Accessible label for the visibility toggle when the password is visible. */
  hideLabel?: string;
  /** Omit to keep the toggle in the keyboard tab order; pass -1 to skip it. */
  toggleTabIndex?: number;
  /** Extra props forwarded to the input (e.g. react-hook-form `register(...)`). */
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  /** Rendered between the input and the error message. */
  children?: ReactNode;
}

export function PasswordField({
  id,
  label,
  error,
  autoComplete,
  placeholder,
  showLabel = "Show password",
  hideLabel = "Hide password",
  toggleTabIndex,
  inputProps,
  children,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={authFormStyles.field}>
      <label htmlFor={id} className={authFormStyles.label}>
        {label}
      </label>
      <div className={authFormStyles.inputWrap}>
        <input
          {...inputProps}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={authFormStyles.inputWithToggle}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className={authFormStyles.toggle}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          tabIndex={toggleTabIndex}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {children}
      <FieldError message={error} />
    </div>
  );
}
