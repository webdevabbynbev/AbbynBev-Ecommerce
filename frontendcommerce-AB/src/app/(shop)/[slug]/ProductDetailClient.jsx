"use client";

import { useEffect, useMemo, useState } from "react";

import { useEffect, useMemo, useState } from "react";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { FaStar } from "react-icons/fa";
import { formatToRupiah, getDiscountPercent } from "@/utils";
import axios from "@/lib/axios";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  Chip,
  TxtField,
  QuantityInput,
  Button,
  BtnIconToggle,
} from "@/components";

const RATING_OPTIONS = [
  { id: 1, value: "5", star: "5" },
  { id: 2, value: "4", star: "4" },
  { id: 3, value: "3", star: "3" },
  { id: 4, value: "2", star: "2" },
  { id: 5, value: "1", star: "1" },
];

export default function ProductDetailClient({ product }) {
  const router = useRouter();
  // ✅ Prevent hydration mismatch for relative time
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const variants = product?.variantItems ?? []; // [{ id, label, price, stock }]
  const [selectedVariant, setSelectedVariant] = useState(
    variants.length === 1 ? variants[0].label : null
  );
  const [qty, setQty] = useState(1);

  const selectedVariantObj = variants.find((v) => v.label === selectedVariant);

  const finalPrice =
    selectedVariantObj?.price ??
    product?.price ??
    product?.base_price ??
    product?.basePrice ??
    product?.realprice ??
    0;

  const realPrice =
    product?.realprice ??
    product?.base_price ??
    product?.basePrice ??
    finalPrice;

  const stock = selectedVariantObj?.stock ?? product?.stock ?? 0;

  const discount =
    product?.sale && realPrice
      ? getDiscountPercent(realPrice, finalPrice)
      : null;

  const handleSelect = (label) => {
    setSelectedVariant((prev) => (prev === label ? null : label));
  };

  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const brandObj =
    typeof product?.brand === "object" && product?.brand !== null
      ? product.brand
      : null;

  const brandName =
    typeof product?.brand === "string" ? product.brand : brandObj?.name || "-";

  const brandSlug = brandObj?.slug || product?.brandSlug || "";

  const handleAddToCart = async () => {
    try {
         const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        alert("Silakan login dulu untuk menambahkan ke keranjang.");
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        } else {
          router.push("/sign-in");
        }
        return;
      }
      if (!product?.id) {
        alert("Product id tidak ditemukan");
        return;
      }

      const variantItems = product?.variantItems ?? [];
      let variant = selectedVariantObj;

      if (!variant && variantItems.length === 1) {
        variant = variantItems[0];
      }

      if (variantItems.length > 0 && !variant) {
        alert("Silakan pilih varian terlebih dahulu");
        return;
      }

      const payload = {
        product_id: product.id,
        variant_id: variantItems.length ? variant.id : 0,
        qty: Number(qty) || 1,
        attributes: [],
        is_buy_now: false,
      };

      const res = await axios.post("/cart", payload);
      alert(res.data?.message || "Produk berhasil dimasukkan ke keranjang");
    } catch (error) {

      console.error("Gagal menambah ke keranjang", error);
      const isUnauthorized = error?.response?.status === 401;
      const msg = isUnauthorized
        ? "Sesi kamu habis. Silakan login ulang."
        : error?.response?.data?.message ||
          "Terjadi kesalahan saat menambah ke keranjang";
      alert(msg);
      if (isUnauthorized) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/sign-in";
        } else {
          router.push("/sign-in");
        }
      }
    }
  };

  return (
    <div className="container mx-auto w-full py-6 px-10 flex justify-between xl:max-w-[1280px] lg:max-w-[960px]">
      <div className="wrapper space-y-10 items-center ">
        <div className="left-wrapper-content w-full flex-row space-y-10">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbLink href={brandSlug ? `/brand/${brandSlug}` : "#"}>
                  {brandName}
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage className="truncate w-[300px]">{product?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Left Content */}
          <div className="left-content w-full flex">
            {/* Product Image */}
            <div className="Image-container">
              <div className="h-[220px] w-[220px] relative overflow-hidden rounded-lg">
                {product?.sale && (
                  <img
                    src="/sale-tag.svg"
                    alt="Sale"
                    className="absolute top-0 left-0 z-10 w-[40px] h-auto"
                  />
                )}

                <div>
                  <img
                    src={product?.image}
                    alt={product?.name}
                    className="w-full h-full object-cover border border-neutral-400"
                  />
                </div>
              </div>

              <div className="flex max-w-[300px] py-2 items-center space-x-4 max-h-64 overflow-x-auto custom-scrollbar">
                {(product?.images?.length
                  ? product.images
                  : [product?.image]
                ).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${product?.name}-${i}`}
                    className="h-[50px] w-[50px] border p-2 rounded-md"
                  />
                ))}
              </div>
            </div>

            {/* Right Content */}
            <div className="Content-right w-full space-y-4 px-10">
              <div className="title-product">
                <h1 className="text-lg font-bold">{brandName}</h1>
                <h2 className="text-xl font-normal">{product?.name}</h2>
              </div>

              {/* Price */}
              <div className="price space-y-2">
                {product?.sale ? (
                  <>
                    <div className="finalPrice">
                      <span className="text-primary-700 text-2xl font-bold">
                        {formatToRupiah(finalPrice)}
                      </span>
                    </div>

                    <div className="reapPrice-container flex space-x-2 items-center">
                      <span className="text-base font-medium text-neutral-400 line-through">
                        {formatToRupiah(realPrice)}
                      </span>

                      {discount > 0 && (
                        <span className="text-[10px] py-1 px-3 bg-primary-200 w-fit rounded-full text-primary-700 font-bold">
                          {discount}% off
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="finalPrice">
                    <span className="text-primary-700 text-2xl font-bold">
                      {formatToRupiah(realPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <span className="flex items-center text-primary-700 font-bold">
                  {Number(averageRating || 0).toFixed(1)}
                  <FaStar className="text-warning-300 ml-1" />
                </span>
                <span className="text-neutral-400">
                  ({reviews.length} reviews)
                </span>
              </div>

              {/* Variants */}
              {product?.variant?.length ? (
                <div className="chip-container flex w-full space-x-3 items-center">
                  <p>{product?.variant_value || "Variant"}:</p>
                  {product.variant.map((v) => (
                    <Chip
                      key={v}
                      onClick={() => handleSelect(v)}
                      isActive={selectedVariant === v}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              ) : null}

              <hr className="w-full border-t border-neutral-200 my-4" />

              {/* Detail */}
              <div className="product-detail space-y-4">
                {/* Summary */}
                <div className="summary space-y-2">
                  <h3 className="text-primary-700 font-bold text-base">
                    Summary
                  </h3>
                  <p className="text-sm">{product?.description}</p>
                </div>

                {/* Shipment */}
                <div className="shipment space-y-2">
                  <h3 className="text-primary-700 font-bold text-base">
                    Shipment
                  </h3>
                  <p className="text-sm">
                    Regular shipment start from
                    <span className="font-bold"> Rp.10.000</span>
                  </p>
                  <p className="text-sm">
                    Estimated time arrived
                    <span className="font-bold"> 3–5 days</span>
                    <span className="text-neutral-300"> | </span>
                    <span className="text-primary-700 font-medium">
                      See our shipping partner
                    </span>
                  </p>
                </div>

                {/* Review */}
                <div className="container-review space-y-6">
                  <div className="filter-review space-y-2">
                    <h3 className="text-primary-700 font-bold text-base">
                      Review
                    </h3>
                    <span>Filter</span>
                    <div className="flex space-x-4">
                      <TxtField
                        placeholder="Search specific topic or review . . ."
                        iconLeftName="MagnifyingGlass"
                        variant="outline"
                        size="md"
                        className="min-w-[280px]"
                      />

                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Rating</SelectLabel>
                            {RATING_OPTIONS.map((rating) => (
                              <SelectItem key={rating.id} value={rating.value}>
                                <div className="flex items-center space-x-1">
                                  <FaStar className="text-warning-300" />
                                  <span>{rating.star}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Review List */}
                  {reviews.length > 0 ? (
                    reviews.map((r) => {
                      const created =
                        r.createdAt ||
                        r.created_at ||
                        r.create_at ||
                        r.updatedAt;

                      const who = r.user?.firstName
                        ? `${r.user.firstName} ${r.user.lastName ?? ""}`.trim()
                        : "Guest";

                      return (
                        <div key={r.id} className="mb-4">
                          <div className="flex space-x-2 items-center">
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={
                                    i < Number(r.rating || 0)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                            </div>

                            <div className="w-1 h-1 rounded-full bg-neutral-400" />

                            {/* ✅ Stable during SSR + first hydrate */}
                            <div className="text-sm text-neutral-400">
                              {created && mounted
                                ? formatDistanceToNow(new Date(created), {
                                    addSuffix: true,
                                  })
                                : "-"}
                            </div>
                          </div>

                          <div className="space-y-2 px-2 py-4">
                            <p className="text-base font-medium">{who}</p>
                            <p className="text-sm font-normal text-neutral-400">
                              {r.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-neutral-400">
                      Belum ada review untuk produk ini.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Sidebar */}
      <div className="sticky top-[103px] p-6 space-y-4 outline-1 outline-neutral-100 rounded-3xl bottom-32 items-start w-full max-w-[300px] h-fit bg-white">
        <div className="text-xl font-medium">Quantity</div>

        <div className="flex justify-between">
          <div className="ContainerImage flex items-start">
            <div className="imageOnly">
              <img
                src={product?.image}
                alt={product?.name}
                className="h-[100px] w-[100px]"
              />
            </div>

            <div className="flex-row space-y-1">
              {product?.sale && (
                <img
                  src="/sale-tag-square.svg"
                  alt="Sale"
                  className="w-[32px] h-[32px]"
                />
              )}

              <div className="text-sm font-normal line-clamp-2">
                {product?.name}
              </div>

              <div className="flex space-x-1 items-center">
                <div className="text-xs text-neutral-600">Variant:</div>
                <div className="text-xs font-bold text-primary-700">
                  {selectedVariant ? selectedVariant : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center space-x-3">
          <QuantityInput min={1} max={stock} value={qty} onChange={setQty} />
          <div className="text-sm font-normal text-neutral-600">
            Stock :{" "}
            <span className="font-medium text-neutral-950">{stock}</span>
          </div>
        </div>

        <div className="price space-y-2 w-full flex-row justify-end">
          {product?.sale ? (
            <>
              <div className="reapPrice-container w-full flex space-x-2 items-center justify-end">
                {discount > 0 && (
                  <span className="text-[10px] py-1 px-3 bg-primary-200 w-fit rounded-full text-primary-700 font-bold">
                    {discount}% off
                  </span>
                )}
                <span className="text-sm font-medium text-neutral-400 line-through">
                  {formatToRupiah(realPrice)}
                </span>
              </div>

              <div className="finalPrice w-full flex space-x-2 items-center justify-between">
                <span>Subtotal</span>
                <span className="text-primary-700 text-base font-bold">
                  {formatToRupiah(finalPrice)}
                </span>
              </div>
            </>
          ) : (
            <div className="finalPrice w-full flex space-x-2 items-center justify-between">
              <span>Subtotal</span>
              <span className="text-primary-700 text-base font-bold">
                {formatToRupiah(realPrice)}
              </span>
            </div>
          )}
        </div>

        <div className="button flex space-x-2">
          <Button
            iconName="CartPlus"
            variant="tertiary"
            size="md"
            className="w-full"
            onClick={handleAddToCart}
          >
            Cart
          </Button>
          <Button variant="primary" size="md" className="w-full">
            Buy now
          </Button>
        </div>

        <hr className="w-full border-t border-neutral-200 my-4" />

        <div className="flex justify-between space-x-2">
          <Button
            iconName="Share"
            variant="tertiary"
            size="sm"
            className="w-full"
          >
            Share product
          </Button>
          <BtnIconToggle iconName="Heart" variant="tertiary" size="sm" />
        </div>
      </div>
    </div>
  );
}


//