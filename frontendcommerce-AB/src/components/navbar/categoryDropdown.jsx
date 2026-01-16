"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useCanHover() {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return canHover;
}

function buildCategoryHref(chain) {
  const path = chain.map((n) => n.slug).filter(Boolean).join("/");
  return `/category/${encodeURI(path)}`;
}

function sanitizeCategories(roots = []) {
  const isPlaceholder = (name = "") => name.toLowerCase().includes("isi dulu");

  const walk = (node) => {
    if (!node || node.deletedAt) return null;
    if (isPlaceholder(node.name)) return null;

    const children = (node.children || []).map(walk).filter(Boolean);

    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      level: node.level,
      iconPublicId: node.iconPublicId,
      children,
    };
  };

  return roots.map(walk).filter(Boolean);
}

function pickDefaultActive(roots) {
  if (!roots?.length) return null;
  const withChildren = roots.find((r) => (r.children || []).length > 0);
  return (withChildren || roots[0])?.slug ?? null;
}

function filterRootPanel(root, query) {
  // Return root children that match query across lvl2/lvl3
  if (!query) return root.children || [];

  const q = query.toLowerCase().trim();
  if (!q) return root.children || [];

  const lvl2 = root.children || [];
  const result = [];

  for (const c2 of lvl2) {
    const c2Match = c2.name.toLowerCase().includes(q);
    const lvl3 = c2.children || [];
    const matchedLvl3 = lvl3.filter((c3) => c3.name.toLowerCase().includes(q));

    if (c2Match) {
      result.push(c2); // show whole group if lvl2 matches
    } else if (matchedLvl3.length) {
      result.push({ ...c2, children: matchedLvl3 }); // show only matched leaves
    }
  }
  return result;
}

const contentClass =
  "z-50 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur " +
  "shadow-2xl shadow-black/10 outline-none " +
  "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 " +
  "data-[state=open]:scale-100 data-[state=closed]:scale-[0.98] " +
  "transition duration-150 will-change-[transform,opacity]";

export default function ShopByCategoryDropdown({
  label = "Shop By Category",
  categories = [],
  maxLeafPerGroup = 10,
}) {
  const pathname = usePathname();
  const canHover = useCanHover();

  const roots = useMemo(() => sanitizeCategories(categories), [categories]);

  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(() => pickDefaultActive(roots));
  const [query, setQuery] = useState("");

  // keep activeSlug valid if data changes
  useEffect(() => {
    if (!roots?.length) return;
    if (!activeSlug || !roots.some((r) => r.slug === activeSlug)) {
      setActiveSlug(pickDefaultActive(roots));
    }
  }, [roots, activeSlug]);

  const activeRoot = useMemo(
    () => roots.find((r) => r.slug === activeSlug) || roots[0],
    [roots, activeSlug]
  );

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

  const panelGroups = useMemo(() => {
    if (!activeRoot) return [];
    return filterRootPanel(activeRoot, query);
  }, [activeRoot, query]);

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
          className={cx(
            contentClass,
            // responsive mega width
            "w-[92vw] max-w-245"
          )}
          sideOffset={10}
          align="start"
          collisionPadding={16}
          {...(canHover
            ? { onMouseEnter: clearCloseTimer, onMouseLeave: scheduleClose }
            : {})}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                Shop By Category
              </span>
              <span className="text-xs text-gray-500">
                Browse makeup, skincare, and more
              </span>
            </div>

            <DropdownMenu.Item asChild>
              <Link
                href="/category"
                className="rounded-lg px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 focus:outline-none"
              >
                View all
              </Link>
            </DropdownMenu.Item>
          </div>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search category (e.g. lip, serum, sunscreen)…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-0 px-2 pb-2 pt-3 md:grid-cols-[240px_1fr]">
            {/* Left: lvl1 roots */}
            <div className="max-h-[65vh] overflow-auto p-2">
              <div className="flex flex-col gap-1">
                {roots.map((root) => {
                  const isActive = root.slug === activeSlug;
                  const href = buildCategoryHref([root]);
                  const isCurrent = pathname === href;

                  return (
                    <DropdownMenu.Item key={root.id} asChild>
                      <Link
                        href={href}
                        onMouseEnter={() => setActiveSlug(root.slug)}
                        onFocus={() => setActiveSlug(root.slug)}
                        aria-current={isCurrent ? "page" : undefined}
                        className={cx(
                          "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm outline-none",
                          "hover:bg-gray-50 focus:bg-gray-50",
                          isActive && "bg-gray-50",
                          isCurrent && "text-primary-700 font-semibold"
                        )}
                      >
                        <span className="truncate">{root.name}</span>
                        <ChevronRightIcon
                          className={cx(
                            "h-4 w-4 text-gray-300 transition",
                            isActive && "text-gray-400"
                          )}
                        />
                      </Link>
                    </DropdownMenu.Item>
                  );
                })}
              </div>
            </div>

            {/* Right: lvl2 groups + lvl3 links */}
            <div className="max-h-[65vh] overflow-auto p-2">
              {activeRoot ? (
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {activeRoot.name}
                  </div>
                  <DropdownMenu.Item asChild>
                    <Link
                      href={buildCategoryHref([activeRoot])}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                    >
                      See all {activeRoot.name}
                    </Link>
                  </DropdownMenu.Item>
                </div>
              ) : null}

              {panelGroups?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {panelGroups.map((lvl2) => {
                    const lvl2Href = buildCategoryHref([activeRoot, lvl2]);
                    const lvl3 = lvl2.children || [];

                    const shown = lvl3.slice(0, maxLeafPerGroup);
                    const hasMore = lvl3.length > shown.length;

                    return (
                      <div key={lvl2.id} className="min-w-0 rounded-xl p-2">
                        <DropdownMenu.Item asChild>
                          <Link
                            href={lvl2Href}
                            className={cx(
                              "mb-2 block rounded-lg px-2 py-1 text-sm font-semibold text-gray-900",
                              "hover:bg-gray-50 focus:bg-gray-50 outline-none"
                            )}
                          >
                            {lvl2.name}
                          </Link>
                        </DropdownMenu.Item>

                        <div className="flex flex-col gap-1">
                          {shown.length ? (
                            shown.map((lvl3Item) => {
                              const lvl3Href = buildCategoryHref([
                                activeRoot,
                                lvl2,
                                lvl3Item,
                              ]);
                              const isCurrent = pathname === lvl3Href;

                              return (
                                <DropdownMenu.Item key={lvl3Item.id} asChild>
                                  <Link
                                    href={lvl3Href}
                                    aria-current={isCurrent ? "page" : undefined}
                                    className={cx(
                                      "rounded-lg px-2 py-1 text-sm text-gray-700 outline-none",
                                      "hover:bg-gray-50 focus:bg-gray-50",
                                      isCurrent && "text-primary-700 font-semibold"
                                    )}
                                  >
                                    {lvl3Item.name}
                                  </Link>
                                </DropdownMenu.Item>
                              );
                            })
                          ) : (
                            <div className="px-2 py-1 text-sm text-gray-500">
                              No subcategory
                            </div>
                          )}

                          {hasMore ? (
                            <DropdownMenu.Item asChild>
                              <Link
                                href={lvl2Href}
                                className="mt-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                              >
                                See all ({lvl3.length})
                              </Link>
                            </DropdownMenu.Item>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No categories found{query ? ` for “${query}”` : ""}.
                </div>
              )}
            </div>
          </div>

          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
