"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import * as React from "react";
import styles from "./input-otp.module.scss";
import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        styles["input-otp-container"],
        props.disabled && styles["input-otp-container--disabled"],
        containerClassName
      )}
      className={cn(
        styles["input-otp"],
        props.disabled && styles["input-otp--disabled"],
        className
      )}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(styles["input-otp-group"], className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(styles["input-otp-slot"], className)}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className={styles["input-otp-caret"]}>
          <div className={styles["input-otp-caret-line"]} />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

// Component implementation

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
