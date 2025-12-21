"use client";

import { useState, useEffect, useMemo } from "react";
import { BevPick } from "@/data";
import { RegularCard, Button, TxtField, Filter } from "@/components";
import { useDebounce } from "../hook/useDebounce";

function shuffledArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const BestSeller = () => {
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);

  const combineData = useMemo(() => {
    return BevPick.map((item) => ({ ...item, type: "regular" }));
  }, []);

  const [mixedData, setMixedData] = useState([]);

  useEffect(() => {
    setMixedData(shuffledArray(combineData));
  }, [combineData]);

  // ✅ ini yang benar: return array hasil filter
  const filteredProducts = useMemo(() => {
    let products = mixedData;

    const q = debounceSearch.trim().toLowerCase();
    if (q) {
      products = products.filter((p) => {
        const name = String(p.name ?? "").toLowerCase();
        const brand = String(p.brand ?? "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      });
    }

    return products;
  }, [mixedData, debounceSearch]);

  // Pagination pakai filteredProducts
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // kalau search berubah, balik ke halaman 1 biar UX enak
  useEffect(() => {
    setCurrentPage(1);
  }, [debounceSearch]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  return (
    <div className="flex w-full mx-auto justify-between xl:max-w-[1280px] lg:max-w-[960px]">
      <div className="w-[400px] pl-10 pr-5 py-6">
        <Filter showBrandFilter={true} className="w-full py-24" />
      </div>

      <div className="wrapper flex-row w-full pr-10 pl-5 py-6 space-y-6">
        <div className="w-full">
          <TxtField
            placeholder="Search your beauty needs here . . ."
            iconLeftName="MagnifyingGlass"
            variant="outline"
            size="md"
            className="w-full min-w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full h-auto grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-6 items-start justify-between">
          {currentItems.map((item, idx) => (
            <RegularCard key={item.id ?? idx} item={item} />
          ))}

          {/* Pagination */}
          <div className="flex justify-center mt-6 space-x-2 col-span-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </Button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-full ${
                  currentPage === i + 1
                    ? "bg-primary-700 text-white"
                    : "bg-secondary-50 text-primary-700 hover:outline-1 outline-primary-700 hover:text-primary-700 transition-all"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestSeller;