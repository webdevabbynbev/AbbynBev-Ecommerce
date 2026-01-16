"use client";

import { buildPageItems } from "@/lib/pagination";
import { useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/Pagination";
import { BlogCard } from "@/components";

const PER_PAGE = 12;
const WP_API = "https://blog.abbynbev.com/wp-json/wp/v2/posts";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageItems = buildPageItems(currentPage, totalPages);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);

      const res = await fetch(
        `${WP_API}?_embed&per_page=${PER_PAGE}&page=${currentPage}`
      );

      setTotalPages(Number(res.headers.get("X-WP-TotalPages")) || 1);
      const data = await res.json();
      setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, [currentPage]);

  const paginationLinkBaseClass =
    "bg-transparent border border-transparent font-bold text-primary-700 hover:bg-secondary-100 transition-all duration-200 cursor-pointer";

  return (
    <main className="xl:max-w-7xl lg:max-w-240 mx-auto px-6 space-y-6">
      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading
          ? [...Array(PER_PAGE)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-neutral-100 animate-pulse"
              />
            ))
          : posts.map((post) => (
              <BlogCard
                key={post.id}
                createdAt={post.date}
                image={post._embedded?.["wp:featuredmedia"]?.[0]?.source_url}
                imgTitle={post.title.rendered}
                title={post.title.rendered}
                article={post.excerpt.rendered}
                category={post._embedded?.["wp:term"]?.[0]?.[0]?.name}
                comment={post.comment_count ?? null}
              />
            ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination>
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

            {pageItems.map((item) => (
              <PaginationItem key={item}>
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
                  if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </main>
  );
}
