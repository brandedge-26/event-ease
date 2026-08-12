"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Featured First", value: "featured" },
  { label: "Price: Low–High", value: "price_asc" },
  { label: "Price: High–Low", value: "price_desc" },
  { label: "Name: A–Z", value: "name_asc" },
  { label: "Largest First", value: "capacity" },
];

export default function VenueSortBar({ count }: { count: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "featured";

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "featured") params.set("sort", value);
    else params.delete("sort");
    params.delete("page"); // reset to page 1 on sort change
    router.push(`/venues${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm font-bold text-black">
        {count} venue{count !== 1 ? "s" : ""} found
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "#6B7280" }}>
          Sort by:
        </span>
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm font-medium bg-white rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          style={{
            border: "1px solid #E5E7EB",
            color: "#111827",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
