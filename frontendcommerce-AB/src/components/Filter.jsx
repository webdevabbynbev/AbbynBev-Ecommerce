"use client";
import { useDebounce } from "@/app/hook/useDebounce";
import React, { useMemo, useState, useEffect } from "react";
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
import { SubList } from ".";
import { FaStar } from "react-icons/fa6";

import { formatToRupiah } from "@/utils";

// ✅ import data langsung dari file JS-mu
import {
  DataFace,
  DataEyebrow,
  DataLips,
  DataCleanser,
  DataMoisturizer,
  DataTreatment,
  DataBooster,
  DataSunCare,
  DataShampoo,
  DataHairStyling,
  DataHairTreatment,
  DataHairTools,
  DataMakeUpBrush,
  DataOrganizer,
  DataMenicure,
  DataFacial,
  DataMakeupTools,
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
    // tooltip sederhana
    const isNum = /^\d*$/.test(e.target.value);
    type === "min" ? setShowTooltipMin(!isNum) : setShowTooltipMax(!isNum);
  };

  // sections: Makeup, Skincare, Haircare, Bath & Body
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
            // field label di data: item.skinconcern
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

  const sections = useMemo(
    () => [
      {
        key: "makeup",
        title: "Makeup",
        items: [
          {
            value: "face",
            label: "Face",
            render: () => (
              <SubList
                data={DataFace}
                prefix="face"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "eyebrow",
            label: "Eyebrow",
            leftBar: false,
            render: () => (
              <SubList
                data={DataEyebrow}
                prefix="eyebrow"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "lips",
            label: "Lips",
            render: () => (
              <SubList
                data={DataLips}
                prefix="lips"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
        ],
      },
      {
        key: "skincare",
        title: "Skincare",
        items: [
          {
            value: "cleanser",
            label: "Cleanser",
            render: () => (
              <SubList
                data={DataCleanser}
                prefix="cleanser"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "moisturizer",
            label: "Moisturizer",
            render: () => (
              <SubList
                data={DataMoisturizer}
                prefix="moisturizer"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "treatment",
            label: "Treatment",
            render: () => (
              <SubList
                data={DataTreatment}
                prefix="treatment"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "booster",
            label: "Booster",
            render: () => (
              <SubList
                data={DataBooster}
                prefix="booster"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "suncare",
            label: "Suncare",
            render: () => (
              <SubList
                data={DataSunCare}
                prefix="suncare"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
        ],
      },
      {
        key: "haircare",
        title: "Haircare",
        items: [
          {
            value: "shampoo",
            label: "Shampoo",
            render: () => (
              <SubList
                data={DataShampoo}
                prefix="shampoo"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "hairstyling",
            label: "Hair styling",
            render: () => (
              <SubList
                data={DataHairStyling}
                prefix="hairstyling"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "hairtreatment",
            label: "Hair treatment",
            render: () => (
              <SubList
                data={DataHairTreatment}
                prefix="hairtreatment"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "hairtools",
            label: "Hair tools",
            render: () => (
              <SubList
                data={DataHairTools}
                prefix="hairtools"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
        ],
      },
      {
        key: "bathbody",
        title: "Bath and body",
        items: [
          {
            value: "makeupbrush",
            label: "Makeup Brush",
            render: () => (
              <SubList
                data={DataMakeUpBrush}
                prefix="makeupbrush"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "organizer",
            label: "Organizer",
            render: () => (
              <SubList
                data={DataOrganizer}
                prefix="organizer"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "menipedi",
            label: "Menicure & Pedicure",
            render: () => (
              <SubList
                data={DataMenicure}
                prefix="menipedi"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "facial",
            label: "Facial",
            render: () => (
              <SubList
                data={DataFacial}
                prefix="facial"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
          {
            value: "makeuptools",
            label: "Makeup Tools",
            render: () => (
              <SubList
                data={DataMakeupTools}
                prefix="makeuptools"
                selectedFilters={selectedFilters}
                onSelect={handleSelect}
              />
            ),
          },
        ],
      },
    ],
    [selectedFilters]
  );

  return (
    <div className="flex-row space-y-10 h-full max-w-[300px]">
      {/* Title */}
      <div className="TitleCat-1 flex-row w-full space-y-4">
        <h3 className="font-medium text-sm">Category</h3>
        <hr className="w-full border-t border-primary-700 py-2" />
        {/* Kategori utama */}
        {sections.map((s) => (
          <NestedSection
            key={s.key}
            title={s.title}
            items={s.items}
            outerClassName={`Accordion${s.title}`}
          />
        ))}
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

      {/* Skin/Body/Hair concern */}
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
        <>
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
                <div>brand tidak ditemukan </div>
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
        </>
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
