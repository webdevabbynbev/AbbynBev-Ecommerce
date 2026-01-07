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

const BestSeller = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({});
  const debounceSearch = useDebounce(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const totalPages = meta?.lastPage || 1;
  const skeleton_card = itemsPerPage;
  const currentItems = products;
  const paginationLinkBaseClass =
    "bg-transparent border border-transparent font-bold text-primary-700 hover:bg-secondary-100 transition-all duration-200 cursor-pointer";
  const pageItems = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i += 1) pageItems.push(i);
  } else {
    const showStartEllipsis = currentPage > 3;
    const showEndEllipsis = currentPage < totalPages - 2;
    pageItems.push(1);

    if (showStartEllipsis) pageItems.push("start-ellipsis");

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    for (let i = startPage; i <= endPage; i += 1) {
      pageItems.push(i);
    }

    if (showEndEllipsis) pageItems.push("end-ellipsis");

    pageItems.push(totalPages);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [debounceSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, debounceSearch, itemsPerPage]);

  return (
    <div className="flex w-full mx-auto flex-col justify-between xl:max-w-7xl lg:max-w-284 lg:flex-row">
      <div className="hidden w-75 lg:w-75 pl-10 pr-2 py-6 lg:block">
        <Filter
          brands={brands}
          showBrandFilter={true}
          className="w-full py-24"
        />
      </div>

      <div className="flex-1 p-6">
        <div className="mb-6 flex flex-row gap-3 sm:flex-row sm:items-center">
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
            <DialogContent className="flex max-h-[80vh] w-full flex-col overflow-y-auto overflow-x-hidden custom-scrollbar sm:max-w-100">
              <DialogHeader>
                <DialogTitle>Filter</DialogTitle>
              </DialogHeader>
              <Filter
                brands={brands}
                showBrandFilter={true}
                className="w-full pb-10"
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          <Pagination className="mt-12">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={currentPage === 1}
                  className={`${paginationLinkBaseClass} ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                />
              </PaginationItem>
              {pageItems.map((item) => (
                <PaginationItem key={item}>
                  {typeof item === "number" ? (
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      className={`${paginationLinkBaseClass} ${
                        item === currentPage ? "bg-secondary-100" : ""
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
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
                  onClick={(event) => {
                    event.preventDefault();
                    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
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

export default BestSeller;
