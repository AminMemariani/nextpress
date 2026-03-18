import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => (
    <div>
      <input
        ref={ref}
        className={`np-input ${error ? "np-input-error" : ""} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="np-input-error-text">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";
