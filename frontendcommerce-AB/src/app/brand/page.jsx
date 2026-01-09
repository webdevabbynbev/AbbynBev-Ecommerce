import { DataBrand } from "@/data";
import { groupBrandsByAlphabet } from "@/utils";
import { Button } from "@/components";
import Link from "next/link";

export default function Page() {
  const groupedBrands = groupBrandsByAlphabet(DataBrand);

  return (
    <div>
      {/* Navigasi huruf A-Z */}
      <div className="sticky top-20 bg-white px-10 py-6 flex flex-wrap gap-2 mb-6 border-primary-700 border-b pb-4 w-full justify-between">
        {Object.keys(groupedBrands).map((letter) => (
          <a
            key={letter}
            href={`#${letter}`}
            className={`text-sm font-medium px-4 ${
              groupedBrands[letter] && "text-primary-700 hover:underline"
            }`}
          >
            {letter}
          </a>
        ))}
      </div>

      {/* List brand per huruf */}
      <div className="px-10">
        {Object.keys(groupedBrands).map((letter) => (
          <div
            key={letter}
            id={letter}
            className="p-4 scroll-mt-38 flex items-center"
          >
            <div className="flex space-x-10 w-full">
              <h2 className="font-bold text-lg border-b">{letter}</h2>
              <div className="flex w-full flex-wrap gap-6">
                {groupedBrands[letter].map((brand) => (
                  <Link key={brand.id} href={`/brand/${brand.slug}`} passHref>
                    <Button
                      variant="tertiary"
                      size="sm"
                      key={brand.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <div>{brand.brandname}</div>
                    </Button>
                  </Link>
                ))}
                <hr className="w-full border-t border-neutral-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
