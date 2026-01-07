"use client";
import { useDebounce } from "@/app/hooks/useDebounce";
import React, { useMemo, useState, useEffect } from "react";
import axios from "@/lib/axios"; // ambil dari backend (NEXT_PUBLIC_API_URL)

import {
  Button,
  TxtField,
  Chip,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components";
import { NestedSection } from "./nestedSection";
import { SubList } from "..";
import { FaStar } from "react-icons/fa6";

import { formatToRupiah } from "@/utils";

// import data filter lain (tetap dipakai)
import {
  DataSkinConcern,
  DataBodyConcern,
  DataHairConcern,
  DataRating,
  DataBrand,
} from "@/data";

export function Filter() {
  // state pilihan filter
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showTooltipMin, setShowTooltipMin] = useState(false);
  const [showTooltipMax, setShowTooltipMax] = useState(false);

  // category dari DB
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // brand (opsional)
  const [showBrandFilter, setShowBrandFilter] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");
  const debouncedSearch = useDebounce(brandSearch, 250);

  const norm = (s = "") =>
    s
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const filteredBrands = useMemo(() => {
    const q = norm(debouncedSearch);
    if (!q) return DataBrand;
    return DataBrand.filter((b) => norm(b.brandname).includes(q));
  }, [debouncedSearch]);

  const handleSelect = (prefix, id) => {
    const key = `${prefix}-${id}`;
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleReset = () => {
    setSelectedFilters([]);
    setMinPrice("");
    setMaxPrice("");
    setBrandSearch("");
  };

  const handleChangePrice = (e, type) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (type === "min") setMinPrice(raw);
    else setMaxPrice(raw);

    const isNum = /^\d*$/.test(e.target.value);
    type === "min" ? setShowTooltipMin(!isNum) : setShowTooltipMax(!isNum);
  };

  // fetch category dari DB
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCatLoading(true);
        const res = await axios.get("/category-types");
        const arr = Array.isArray(res?.data?.serve) ? res.data.serve : [];
        if (alive) setCategoryTypes(arr);
      } catch (err) {
        console.error("Failed to load category-types:", err);
        if (alive) setCategoryTypes([]); // tanpa fallback dummy
      } finally {
        if (alive) setCatLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // concern sections (tetap sama)
  const concern_sections = useMemo(
    () => [
      {
        key: "skincareconcern",
        title: "Skincare concern",
        items: [
          {
            value: "skinconcern",
            label: "Skincare concern",
            leftBar: false,
            list: DataSkinConcern,
            prefix: "skinconcern",
            getLabel: (row) => row.skinconcern,
          },
        ],
      },
      {
        key: "bodyconcern",
        title: "Body concern",
        items: [
          {
            value: "bodyconcern",
            label: "Body concern",
            leftBar: false,
            list: DataBodyConcern,
            prefix: "bodyconcern",
            getLabel: (row) => row.bodyconcern,
          },
        ],
      },
      {
        key: "hairconcern",
        title: "Hair concern",
        items: [
          {
            value: "hairconcern",
            label: "Hair concern",
            leftBar: false,
            list: DataHairConcern,
            prefix: "hairconcern",
            getLabel: (row) => row.hairconcern,
          },
        ],
      },
    ],
    [selectedFilters]
  );

  // ✅ Sections category hanya dari DB (tanpa fallback)
  const sections = useMemo(() => {
    const roots = Array.isArray(categoryTypes) ? categoryTypes : [];
    if (roots.length === 0) return [];

    return roots.map((root) => {
      const children = Array.isArray(root?.children) ? root.children : [];

      const itemsLevel2 = (children.length ? children : [root]).map((child) => {
        const grand = Array.isArray(child?.children) ? child.children : [];

        const list = grand.length
          ? grand.map((g) => ({ id: g.id, label: g.name }))
          : [{ id: child.id, label: child.name }];

        return {
          value: `cat-${child.id}`,
          label: child?.name || "Category",
          leftBar: true,
          render: () => (
            <SubList
              data={list}
              prefix="category_type"
              selectedFilters={selectedFilters}
              onSelect={handleSelect}
            />
          ),
        };
      });

      return {
        key: `cat-root-${root.id}`,
        title: root?.name || "Category",
        items: itemsLevel2,
      };
    });
  }, [categoryTypes, selectedFilters]);

  return (
    <div className="flex-row space-y-10 h-full max-w-[300px]">
      {/* Category */}
      <div className="TitleCat-1 flex-row w-full space-y-4">
        <h3 className="font-medium text-sm">
          Category {catLoading ? "(loading...)" : ""}
        </h3>
        <hr className="w-full border-t border-primary-700 py-2" />

        {catLoading ? null : sections.length === 0 ? (
          <div className="text-sm text-gray-500">No categories found</div>
        ) : (
          sections.map((s) => (
            <NestedSection
              key={s.key}
              title={s.title}
              items={s.items}
              outerClassName={`Accordion${s.title}`}
            />
          ))
        )}
      </div>

      {/* Price Range */}
      <div className="TitleCat-2 flex-row w-full space-y-4">
        <h3 className="w-[146px] font-medium text-base">Price range</h3>
        <hr className="w-full border-t border-primary-700 my-4" />
        <div className="Price flex-row w-full space-y-2 items-center">
          <div className="textfieldmin w-full">
            <TooltipProvider>
              <Tooltip open={showTooltipMin}>
                <TooltipTrigger asChild>
                  <TxtField
                    label="minimum price"
                    value={formatToRupiah(minPrice)}
                    onChange={(e) => handleChangePrice(e, "min")}
                    placeholder="Rp.0"
                    variant="outline"
                    className="w-full"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>You can only enter a number</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="textfieldmax w-full">
            <TooltipProvider>
              <Tooltip open={showTooltipMax}>
                <TooltipTrigger asChild>
                  <TxtField
                    label="maximum price"
                    value={formatToRupiah(maxPrice)}
                    onChange={(e) => handleChangePrice(e, "max")}
                    placeholder="Rp.0"
                    variant="outline"
                    className="w-full"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>You can only enter a number</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* By concern */}
      <div className="TitleCat-3 flex-row w-full space-y-2">
        <h3 className="w-[146px] font-medium text-base">By concern</h3>
        <hr className="w-full border-t border-primary-700 my-4" />
        {concern_sections.map((s) => (
          <NestedSection
            key={s.key}
            title={s.title}
            items={s.items}
            outerClassName={`Accordion${s.title}`}
          />
        ))}
      </div>

      {/* Brand (opsional) */}
      {showBrandFilter && (
        <div className="TitleCat-4 flex-row w-full space-y-2 justify-between">
          <h3 className="w-auto font-medium text-base">Brand</h3>
          <hr className="w-full border-t border-primary-700 my-4" />
          <TxtField
            placeholder="Search brand here..."
            iconLeftName="MagnifyingGlass"
            variant="outline"
            className="w-full"
            value={brandSearch ?? ""}
            onChange={(e) => setBrandSearch(e.target.value)}
          />

          <div>
            {brandSearch && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => setBrandSearch("")}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-4 w-full py-2 px-1 h-auto max-h-64 overflow-y-auto custom-scrollbar">
            {filteredBrands.length === 0 ? (
              <div>brand tidak ditemukan</div>
            ) : (
              filteredBrands.map((item) => {
                const uniqueId = `brand-${item.id}`;
                const isActive = selectedFilters.includes(uniqueId);
                return (
                  <Chip
                    key={item.id}
                    label={item.brandname}
                    onClick={() => handleSelect("brand", item.id)}
                    isActive={isActive}
                  >
                    {item.brandname}
                  </Chip>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="TitleCat-5 flex-row w-full space-x-4 justify-between items-center">
        <div className="items-center flex space-x-2">
          <h3 className="w-auto font-medium text-base">Rating</h3>
          <FaStar className="text-warning-300 h-[20px] w-[20px]" />
        </div>
        <hr className="w-full border-t border-primary-700 my-4" />
        <div className="flex flex-wrap gap-4 w-full py-2 px-1">
          {DataRating.map((item) => {
            const uniqueId = `rating-${item.id}`;
            const isActive = selectedFilters.includes(uniqueId);
            return (
              <Chip
                key={item.id}
                label={item.star}
                onClick={() => handleSelect("rating", item.id)}
                isActive={isActive}
              >
                {item.star}
              </Chip>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="w-auto flex justify-between space-x-4">
        <Button
          onClick={handleReset}
          variant="primary"
          size="sm"
          disabled={
            selectedFilters.length === 0 &&
            !minPrice &&
            !maxPrice &&
            !brandSearch
          }
        >
          Reset filter
        </Button>
      </div>
    </div>
  );
}
