"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RegularCard,
  Button,
  TxtField,
  Filter,
  RegularCardSkeleton,
} from "@/components";
import { useDebounce } from "../hook/useDebounce";
import { getProducts } from "@/services/api/product.services";
import { getBrands } from "@/services/api/brands.services";

const BestSeller = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resProducts, resBrands] = await Promise.all([
          getProducts({}),
          getBrands(),
        ]);

        console.log("Data Produk dari API:", resProducts.data);
        setProducts(resProducts.data || []);
        setBrands(resBrands.data || []);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    const q = debounceSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const name = String(p.name ?? "").toLowerCase();
        const brand = String(p.brand?.name || p.brand || "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      });
    }
    return result;
  }, [debounceSearch, products]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const skeleton_card = itemsPerPage;

  return (
    <div className="flex w-full mx-auto justify-between xl:max-w-[1280px] lg:max-w-[1136px]">
      <div className="w-[300px] xl:w-[300px] pl-10 pr-2 py-6">
        <TxtField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeftName="MagnifyingGlass"
        />
        <Filter
          brands={brands}
          showBrandFilter={true}
          className="w-full py-24"
        />
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-4 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(skeleton_card)].map((_, i) => (
              <RegularCardSkeleton key={i} />
            ))
          ) : currentItems.length > 0 ? (
            currentItems.map((product) => (
              <RegularCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center py-20 text-neutral-400">
              No products found.
            </p>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-4">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSeller;
