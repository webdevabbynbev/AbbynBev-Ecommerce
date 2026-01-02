"use client";

import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Filter,
  TxtField,
  Button,
  RegularCard,
} from "@/components";

export default function BrandDetailClient({ brandData }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // dummy produk
  const allItems = brandData.products || [];
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const currentItems = allItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex md:flex Container px-10 py-6 w-full">
      <div className="content-wrapper w-full space-y-10">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/brand">Brand</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="capitalize">
              {brandData.slug || brandData.brandname}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="w-full h-auto">
          <img
            src={`/${brandData.header}`}
            alt={brandData.brandname}
            className="object-contain w-full rounded-2xl"
          />
        </div>

        {/* Brand info */}
        <div className="w-full flex flex-col md:flex-row md:items-center gap-10">
          <div className="h-[150px] w-[150px] flex items-center justify-center rounded-xl bg-white shadow">
            <img
              src={`/${brandData.logo}`}
              alt={brandData.brandname}
              className="p-2 max-h-[150px] max-w-[150px] object-contain"
            />
          </div>
          <div className="flex flex-col space-y-3 w-full">
            <div className="text-lg font-bold">{brandData.brandname}</div>
            <div className="text-sm">{brandData.profile}</div>
          </div>
        </div>

        <div className="flex w-full justify-between">
          {/* Sidebar filter */}
          <div className="w-[400px] pr-5 py-6">
            <Filter showBrandFilter={false} className="w-full py-24" />
          </div>

          {/* Products list */}
          <div className="wrapper flex-row w-full pr-10 pl-5 py-6 space-y-6">
            <div className="w-full">
              <TxtField
                placeholder="Search your beauty needs here . . ."
                iconLeftName="MagnifyingGlass"
                variant="outline"
                size="md"
                className="w-full min-w-[280px]"
              />
            </div>

            <div className="w-full h-auto grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-6 items-start justify-between">
              {currentItems.length === 0 ? (
                <div className="col-span-full text-sm text-neutral-500">
                  Belum ada produk untuk brand ini.
                </div>
              ) : (
                currentItems.map((product) => (
                  <RegularCard key={product.id} product={product} />
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
