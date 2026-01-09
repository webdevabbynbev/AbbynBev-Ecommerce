"use client";
import React, { useState, useEffect } from "react";
import { AddressList } from ".";
import { EditProfile, NewAddress } from "./popup";
import { getUser } from "@/services/auth";
import { Button, ProfileSkeleton} from "@/components";
import {
  FaVenus,
  FaMars,
  FaPhone,
  FaEnvelope,
  FaRightFromBracket,
  FaUserXmark,
} from "react-icons/fa6";

export function Profilepage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { user: fetchedUser } = await getUser();
        setProfile({ user: fetchedUser || null });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  const currentUser = profile?.user ?? null;
  if (!currentUser)
    return <div className="p-4 text-neutral-500">Profile not available.</div>;

  const genderNum = Number(currentUser.gender ?? 0);
  const photoUrl = currentUser.photoProfile
    ? `${process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "")}/${
        currentUser.photoProfile
      }`
    : "/default-avatar.png";

  const handleProfileUpdated = async (updated) => {
    // Optimistic update
    if (updated) setProfile((prev) => ({ ...(prev || {}), user: updated }));
    // Optional: refetch sekali biar 100% sinkron
    try {
      const { user: fresh } = await getUser();
      if (fresh) setProfile({ user: fresh });
    } catch {}
  };

  return (
    <div className="bg-transparent w-full justify-center h-auto space-y-4">
      {/* Header + avatar */}
      <div className="title px-4 text-neutral-500">
        <h1 className="font-bold text-neutral-950 text-xl">Profile</h1>
      </div>

      <div className="rounded-4xl bg-white px-6 py-10 space-y-10 w-full">
        <div className="flex sm:flex-col md:flex-row w-full h-auto md:items-center sm:items-start justify-between gap-4">
          <div className="avatar rounded-full h-[100px] min-w-[100px] border-4">
            <img
              src={photoUrl}
              alt="Profile photo"
              className="h-[100px] w-[100px] rounded-full object-cover"
            />
          </div>

          <div className="profile-data w-full items-start flex-row space-y-2">
            <div className="items-center">
              <div className="name flex md:flex-row sm:flex-col text-lg font-medium gap-2 py-4">
                <h2 className="items-start space-y-2" value="name">
                  {`${currentUser.firstName || ""} ${
                    currentUser.lastName || ""
                  }`.trim() || "—"}
                </h2>
                <div className="items-center justify-center">
                  {genderNum === 1 ? (
                    <span className="Gender items-center w-fit flex space-x-2 text-xs text-blue-400 bg-blue-100 py-1 px-2 rounded-full">
                      <FaMars className="h-4 w-4" />
                      <p className="font-bold text-sm">Male</p>
                    </span>
                  ) : genderNum === 2 ? (
                    <span className="Gender items-center w-fit flex space-x-2 text-xs text-primary-400 bg-primary-100 py-1 px-2 rounded-full">
                      <FaVenus className="h-4 w-4" />
                      <p className="font-bold text-sm">Female</p>
                    </span>
                  ) : (
                    <span className="Gender items-center w-fit flex space-x-2 text-xs text-neutral-500 bg-neutral-100 py-1 px-2 rounded-full">
                      <p className="font-bold text-sm">—</p>
                    </span>
                  )}
                </div>
              </div>

              <div className="phone-and-email flex sm:flex-col md:flex-row text-sm text-neutral-600 font-normal gap-4 w-full h-auto">
                <div
                  className="flex items-center py-2 px-4 bg-neutral-50 border-1 rounded-full h-auto w-fit"
                  value="phone-number"
                >
                  <span className="space-x-4 flex items-center">
                    <FaPhone className="h-4 w-4 text-neutral-300" />
                    <p>
                      {currentUser.phoneNumber
                        ? `${currentUser.phoneNumber}`.trim()
                        : "—"}
                    </p>
                  </span>
                </div>
                <div
                  className="flex items-center space-x-2 py-2 px-4 bg-neutral-50 border-1 rounded-full h-auto w-fit"
                  value="email"
                >
                  <span className="space-x-4 flex items-center">
                    <FaEnvelope className="h-4 w-4 text-neutral-300" />
                    <p>
                      {currentUser.email ? `${currentUser.email}`.trim() : "—"}
                    </p>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 space-x-2 w-full h-auto flex md:flex-col sm:items-start sm:justify-start md:items-end md:justify-end">
            <EditProfile onProfileUpdated={handleProfileUpdated} />
            <Button variant="tertiary" size="sm">
              Change password
            </Button>
          </div>
        </div>

        {/* Address list & management … */}
        <div className="p-4 font-medium text-base bg-muted border-1 border-neutral-100 w-full rounded-2xl space-y-6">
          <div className="flex w-full items-center justify-between">
            <h3 className="font-bold">Address list</h3>
            <NewAddress />
          </div>
          <div className="AddressCard">
            <AddressList />
            <div />
          </div>
        </div>
      </div>

      <div className="p-4 font-medium text-base space-y-6 bg-muted border-1 border-neutral-100 w-full rounded-2xl">
        <div className="flex w-full items-center justify-between">
          <h3 className="font-bold">Account management</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col items-start gap-4 border-neutral-200 bg-white p-6 rounded-xl">
            <div className="flex items-center space-x-2">
              <span>
                <FaRightFromBracket />
              </span>
              <h2 className="font-bold text-base">Sign out?</h2>
            </div>
            <p className="text-sm text-neutral-600 bg-neutral-100 p-4 rounded-xl">
              You're signing out from your beauty space. We'll be here when
              you're ready to come back — with your favorites saved and waiting.
            </p>
            <Button variant="primary" size="sm">
              Sign out
            </Button>
          </div>

          <div className="flex flex-col items-start gap-4 border-neutral-200 bg-white p-6 rounded-xl">
            <div className="flex items-center space-x-2">
              <span>
                <FaUserXmark />
              </span>
              <h2 className="font-bold text-base">Deactivate account</h2>
            </div>
            <p className="text-sm text-neutral-600 bg-neutral-100 p-4 rounded-xl">
              Once you proceed, your account and all associated data will be
              permanently deleted. This action cannot be undone.
            </p>
            <Button variant="error" size="sm">
              Deactivate account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
