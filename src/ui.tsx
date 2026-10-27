import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { X, ChevronDown, Check } from "lucide-react";
export function Button({
  variant = "secondary",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const reduced = useReducedMotion();
  return <motion.button {...props} whileHover={reduced ? undefined : {scale:.985,y:0}} whileTap={reduced ? undefined : {scale:.97,y:0}} transition={{type:"spring",stiffness:320,damping:29,mass:.85}} className={`button ${variant} ${className}`} />;
}
export function IconButton({
  label,
  children,
  ...props
}: HTMLMotionProps<"button"> & { label: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.button {...props} whileHover={reduced ? undefined : {scale:.985}} whileTap={reduced ? undefined : {scale:.96}} transition={{type:"spring",stiffness:320,damping:29,mass:.85}} className="icon-button" aria-label={label} title={label}>
      {children}
    </motion.button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "error" | "warning";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const previous = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-scrim" />
        <Dialog.Content
          className="modal"
          onOpenAutoFocus={(event) => {
            previous.current = document.activeElement as HTMLElement;
            const input = (event.target as HTMLElement).querySelector<HTMLInputElement>("input");
            if (input) { event.preventDefault(); input.focus(); }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (previous.current?.isConnected) previous.current.focus();
            else
              document
                .querySelector<HTMLButtonElement>(
                  '[aria-label="Buka navigasi"]',
                )
                ?.focus();
          }}
        >
          <header>
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Tutup dialog">
                <X size={18} />
              </IconButton>
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Menu({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="button" aria-label="Pilih kategori">
          {value}
          <ChevronDown size={14} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="popover"
          sideOffset={10}
          collisionPadding={12}
          align="start"
          aria-label="Daftar kategori"
        >
          {options.map((option) => (
            <Popover.Close asChild key={option}>
              <button className="menu-option" onClick={() => onChange(option)}>
                {option}
                {option === value && <Check size={15} />}
              </button>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}



