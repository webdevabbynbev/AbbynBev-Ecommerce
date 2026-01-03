"use client";
import React, { memo } from "react";
import clsx from "clsx";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components";
import { FaPlusCircle, FaMinusCircle, FaChevronDown } from "react-icons/fa";

function NestedSectionComponent({ title, items = [], outerClassName }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <Accordion
      type="single"
      className={clsx(
        "rounded-2xl w-full bg-white px-4 transition-all outline-1 outline-neutral-100",
        outerClassName
      )}
      collapsible
    >
      <AccordionItem value={`sec-${title}`}>
        <AccordionTrigger className="flex justify-between items-center group">
          <span className="font-bold text-sm">{title}</span>
          <FaPlusCircle className="h-4 w-4 group-data-[state=open]:hidden text-primary-700" />
          <FaMinusCircle className="h-4 w-4 hidden group-data-[state=open]:block text-primary-700" />
        </AccordionTrigger>

        <AccordionContent>
          <Accordion
            className="w-auto px-4 bg-neutral-50 transition-all justify-between rounded-r-[12px] space-y-4"
            collapsible
          >
            {safeItems.map(({ value, label, leftBar = true, render }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger className="relative">
                  {leftBar && <div className="absolute -left-4 h-full w-[4px] bg-primary-700 mr-10" />}
                  <span className="text-xs">{label}</span>
                  <FaChevronDown className="h-3 w-3 after:rotate-180 group-data-[state=open]:hidden text-neutral-400" />
                </AccordionTrigger>
                <AccordionContent>{render?.()}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const NestedSection = memo(NestedSectionComponent);
