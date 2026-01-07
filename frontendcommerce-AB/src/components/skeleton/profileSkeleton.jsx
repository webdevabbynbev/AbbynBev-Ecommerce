"use client";

export default function ProfileSkeleton() {
  return (
    <div className="bg-transparent w-full justify-center h-auto space-y-4 animate-pulse">
      {/* Title */}
      <div className="title px-4">
        <div className="h-6 w-28 bg-neutral-200 rounded" />
      </div>

      {/* Profile container */}
      <div className="container rounded-4xl bg-white p-4 space-y-4 border border-neutral-100">
        <div className="flex sm:flex-col md:flex-row w-full h-auto md:items-center sm:items-start justify-between gap-4">
          {/* Avatar */}
          <div className="avatar rounded-full h-25 min-w-25 bg-neutral-200" />

          {/* Profile data */}
          <div className="profile-data w-full items-start flex-row space-y-2">
            <div className="space-y-3">
              {/* Name + gender chip */}
              <div className="name flex text-lg font-medium space-x-2 items-center">
                <div className="h-5 w-48 bg-neutral-200 rounded" />
                <div className="h-6 w-20 bg-neutral-200 rounded-full" />
              </div>

              {/* Phone + Email pills */}
              <div className="phone-and-email flex sm:flex-col md:flex-row text-sm gap-4 w-full h-auto">
                <div className="h-9 w-52 bg-neutral-100 rounded-full border" />
                <div className="h-9 w-64 bg-neutral-100 rounded-full border" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 space-x-2 w-full h-auto flex md:flex-col sm:items-start sm:justify-start md:items-end md:justify-end">
            <div className="h-9 w-32 bg-neutral-200 rounded-xl" />
            <div className="h-9 w-40 bg-neutral-200 rounded-xl" />
          </div>
        </div>

        {/* Address list card */}
        <div className="p-4 font-medium text-base bg-neutral-50 border border-neutral-100 w-full rounded-2xl space-y-6">
          <div className="flex w-full items-center justify-between">
            <div className="h-5 w-28 bg-neutral-200 rounded" />
            <div className="h-9 w-36 bg-neutral-200 rounded-xl" />
          </div>

          <div className="AddressCard space-y-3">
            {/* address item 1 */}
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-4 w-80 max-w-full bg-neutral-200 rounded" />
              <div className="h-4 w-64 max-w-full bg-neutral-200 rounded" />
              <div className="h-4 w-40 max-w-full bg-neutral-200 rounded" />
              <div className="mt-2 h-9 w-28 bg-neutral-200 rounded-xl" />
            </div>
            {/* address item 2 */}
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-4 w-80 max-w-full bg-neutral-200 rounded" />
              <div className="h-4 w-64 max-w-full bg-neutral-200 rounded" />
              <div className="h-4 w-40 max-w-full bg-neutral-200 rounded" />
              <div className="mt-2 h-9 w-28 bg-neutral-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Account management */}
      <div className="p-4 font-medium text-base space-y-6 bg-neutral-50 border border-neutral-100 w-full rounded-2xl">
        <div className="flex w-full items-center justify-between">
          <div className="h-5 w-40 bg-neutral-200 rounded" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* DialogCard 1 */}
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-neutral-200 rounded" />
              <div className="h-5 w-28 bg-neutral-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 rounded" />
              <div className="h-4 w-11/12 bg-neutral-200 rounded" />
              <div className="h-4 w-5/6 bg-neutral-200 rounded" />
            </div>
            <div className="h-9 w-28 bg-neutral-200 rounded-xl" />
          </div>

          {/* DialogCard 2 */}
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-neutral-200 rounded" />
              <div className="h-5 w-36 bg-neutral-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 rounded" />
              <div className="h-4 w-11/12 bg-neutral-200 rounded" />
              <div className="h-4 w-5/6 bg-neutral-200 rounded" />
            </div>
            <div className="h-9 w-36 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
