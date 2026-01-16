"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  RegularCard,
  TxtField,
  Filter,
  RegularCardSkeleton,
} from "@/components";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/Pagination";
import { useDebounce } from "../hooks/useDebounce";
import { getProducts } from "@/services/api/product.services";
import { getBrands } from "@/services/api/brands.services";
import { buildPageItems } from "@/lib/pagination";

const BestSellerClient = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({});
  const debounceSearch = useDebounce(search, 500);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;
  const totalPages = meta?.lastPage || 1;
  const skeletonCard = itemsPerPage;
  const currentItems = products;

  const paginationLinkBaseClass =
    "bg-transparent border border-transparent font-bold text-primary-700 hover:bg-secondary-100 transition-all duration-200 cursor-pointer";

  const pageItems = buildPageItems(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounceSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        isInitialLoading ? setIsInitialLoading(true) : setIsFetching(true);

        const [resProducts, resBrands] = await Promise.all([
          getProducts({
            page: currentPage,
            per_page: itemsPerPage,
            name: debounceSearch,
          }),
          getBrands(),
        ]);

        setProducts(resProducts.data || []);
        setMeta(resProducts.meta || {});
        setBrands(resBrands.data || []);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsInitialLoading(false);
        setIsFetching(false);
      }
    };

    fetchData();
  }, [currentPage, debounceSearch, itemsPerPage]);

  return (
    <div className="flex w-full mx-auto flex-col justify-between xl:max-w-7xl lg:max-w-284 lg:flex-row">
      <h1 className="sr-only">
        Produk best seller Abby n Bev yang paling sering diburu.
      </h1>

      {/* FILTER DESKTOP */}
      <div className="hidden w-75 lg:w-75 pl-10 pr-2 py-6 lg:block">
        <Filter brands={brands} showBrandFilter className="w-full py-24" />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">
        {/* SEARCH + FILTER MOBILE */}
        <div className="mb-6 flex gap-3 sm:items-center">
          <TxtField
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconLeftName="MagnifyingGlass"
            className="w-full"
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="tertiary"
                className="w-fit px-6 sm:w-auto lg:hidden"
              >
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[80vh] w-full flex-col overflow-y-auto custom-scrollbar sm:max-w-100">
              <DialogHeader>
                <DialogTitle>Filter</DialogTitle>
              </DialogHeader>
              <Filter
                brands={brands}
                showBrandFilter
                disabled={isInitialLoading || isFetching}
                className="w-full py-24"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isInitialLoading || isFetching ? (
            [...Array(skeletonCard)].map((_, i) => (
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

        {/* PAGINATION */}
        {!isInitialLoading && totalPages > 1 && (
          <Pagination className="mt-12">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={currentPage === 1}
                  className={`${paginationLinkBaseClass} ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                />
              </PaginationItem>

              {pageItems.map((item, index) => (
                <PaginationItem key={`${item}-${index}`}>
                  {typeof item === "number" ? (
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      className={`${paginationLinkBaseClass} ${
                        item === currentPage ? "bg-secondary-100" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={currentPage === totalPages}
                  className={`${paginationLinkBaseClass} ${
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage((p) => p + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default BestSellerClient;
