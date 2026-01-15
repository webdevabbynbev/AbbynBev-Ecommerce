"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    // Desktop-ish: hover + pointer fine
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return canHover;
}

const contentClass =
  "z-50 min-w-[260px] rounded-xl border border-gray-200 bg-white/95 backdrop-blur p-1 " +
  "shadow-2xl shadow-black/10 outline-none " +
  "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 " +
  "data-[state=open]:scale-100 data-[state=closed]:scale-[0.98] " +
  "transition duration-150 will-change-[transform,opacity]";

const itemBase =
  "group flex w-full select-none items-start justify-between gap-3 rounded-lg px-3 py-2 " +
  "text-sm text-gray-800 outline-none " +
  "hover:bg-gray-50 focus:bg-gray-50 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none";

const subIconClass =
  "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 group-data-[state=open]:translate-x-0.5";

function LeafItem({ node, pathname }) {
  const isActive = node.href && pathname === node.href;

  return (
    <DropdownMenu.Item asChild>
      <Link
        href={node.href}
        aria-current={isActive ? "page" : undefined}
        className={cx(
          "w-full",
          itemBase,
          "justify-start",
          isActive && "bg-gray-50 text-primary-700"
        )}
      >
        <span className="flex flex-col gap-0.5">
          <span className={cx("leading-5", isActive && "font-semibold")}>
            {node.label}
          </span>
          {node.description ? (
            <span className="text-xs leading-4 text-gray-500">{node.description}</span>
          ) : null}
        </span>
      </Link>
    </DropdownMenu.Item>
  );
}

function Node({ node, pathname }) {
  const hasChildren = !!node.children?.length;

  if (!hasChildren) return <LeafItem node={node} pathname={pathname} />;

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className={cx(itemBase, "data-[state=open]:bg-gray-50")}>
        <span className="truncate">{node.label}</span>
        <ChevronRightIcon className={subIconClass} />
      </DropdownMenu.SubTrigger>

      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          className={contentClass}
          side="right"
          align="start"
          sideOffset={10}
          alignOffset={-4}
          collisionPadding={16}
        >
          <div className="max-h-[70vh] overflow-auto p-1">
            {node.children.map((child) => (
              <Node key={`${child.label}-${child.href ?? "group"}`} node={child} pathname={pathname} />
            ))}
          </div>
          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

export default function MegaDropdown({ label, items }) {
  const pathname = usePathname();
  const canHover = useCanHover();

  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  // Prevent re-creating handlers
  const hoverHandlers = useMemo(() => {
    if (!canHover) return {};
    return {
      onMouseEnter: () => {
        clearCloseTimer();
        setOpen(true);
      },
      onMouseLeave: scheduleClose,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canHover]);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cx(
            "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium",
            "text-gray-700 hover:text-primary-700 hover:bg-gray-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2"
          )}
          aria-label={`${label} menu`}
          {...hoverHandlers}
        >
          <span className="whitespace-nowrap">{label}</span>
          <ChevronRightIcon
            className={cx(
              "h-4 w-4 rotate-90 text-gray-400 transition-transform",
              open && "-rotate-90"
            )}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={contentClass}
          sideOffset={10}
          align="start"
          collisionPadding={16}
          {...(canHover
            ? {
                onMouseEnter: clearCloseTimer,
                onMouseLeave: scheduleClose,
              }
            : {})}
        >
          {/* Optional: header/quick link */}
          <DropdownMenu.Item asChild>
            <Link
              href="/"
              className={cx(
                itemBase,
                "justify-start font-semibold text-gray-900 hover:bg-gray-50"
              )}
            >
              Explore {label}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

          <div className="max-h-[70vh] overflow-auto p-1">
            {items.map((lvl1) => (
              <Node key={`${lvl1.label}-${lvl1.href ?? "group"}`} node={lvl1} pathname={pathname} />
            ))}
          </div>

          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
