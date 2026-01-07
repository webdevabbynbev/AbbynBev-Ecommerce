"use client";
import React, { memo } from "react";
import clsx from "clsx";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components";
import { FaChevronDown } from "react-icons/fa";

function NestedSectionComponent({ title, items = [], outerClassName }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <Accordion
      type="single"
      className={clsx(
        "w-full px-4 transition-all",
        outerClassName
      )}
      collapsible
    >
      {safeItems.map(({ value, label, leftBar = true, render }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger className="relative">
            {leftBar && (
              <div className="absolute -left-4 h-full w-1 bg-primary-700 mr-10" />
            )}
            <span className="text-xs">{label}</span>
            <FaChevronDown className="h-3 w-3 after:rotate-180 group-data-[state=open]:hidden text-neutral-400" />
          </AccordionTrigger>
          <AccordionContent>{render?.()}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export const NestedSection = memo(NestedSectionComponent);
