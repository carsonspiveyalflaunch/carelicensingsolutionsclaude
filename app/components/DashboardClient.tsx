"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  CreditCard,
  DownloadCloud,
  ExternalLink,
  Eye,
  EyeOff,
  Package,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useAuth } from "./AuthContext";
import { supabase } from "../../utils/supabase";
import { normalizeBundleFileLabel } from "@/lib/bundles";

interface DashboardClientProps {
  user: any;
  profile: any;
  userProducts: any[];
  purchases: any[];
}

export default function DashboardClient({
  user,
  profile,
  userProducts,
  purchases,
}: DashboardClientProps) {
  const activeCourses = useMemo(
    () => userProducts.filter((item) => item.products.type === "course"),
    [userProducts],
  );

  const [bundleFilesMap, setBundleFilesMap] = useState<Record<string, any[]>>(
    {},
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { updatePassword } = useAuth();

  const activeBundles = useMemo(
    () => userProducts.filter((item) => item.products?.type === "bundle"),
    [userProducts],
  );

  useEffect(() => {
    const fetchBundleFiles = async () => {
      if (!supabase || activeBundles.length === 0) {
        return;
      }

      console.log('🔍 DashboardClient - Fetching bundle files...');
      console.log('  activeBundles count:', activeBundles.length);
      console.log('  purchases count:', purchases.length);
      console.log('  purchases data:', purchases);

      const bundlesNeedingFiles = activeBundles.filter((bundle) => {
        const metadataFiles = bundle.products?.metadata?.files;
        return (
          (!Array.isArray(metadataFiles) || metadataFiles.length === 0) &&
          !!bundle.products?.product_slug
        );
      });

      if (bundlesNeedingFiles.length === 0) {
        return;
      }

      const client = supabase;
      const bundleFiles = await Promise.all(
        bundlesNeedingFiles.map(async (bundle) => {
          if (!client) {
            return { id: bundle.id, files: [], purchasedItems: [] };
          }

          const { data, error } = await client.storage
            .from(
              process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "bundle-files",
            )
            .list(bundle.products.product_slug, {
              limit: 100,
              offset: 0,
              sortBy: { column: "name", order: "asc" },
            });

          if (error || !data) {
            return { id: bundle.id, files: [], purchasedItems: [] };
          }

          // Find purchases for this bundle to determine which items were purchased
          const bundlePurchases = purchases.filter((p: any) => {
            const items = Array.isArray(p.items) ? p.items : [];
            return items.some((item: any) => item.product_id === bundle.product_id);
          });

          // Collect all individually purchased item names for this bundle
          const purchasedItemNames = new Set<string>();
          let hasFullBundlePurchase = false;
          
          bundlePurchases.forEach((p: any) => {
            const items = Array.isArray(p.items) ? p.items : [];
            items.forEach((item: any) => {
              if (item.product_id === bundle.product_id) {
                // If purchased_item is set, it's an individual item
                if (item.purchased_item) {
                  purchasedItemNames.add(item.purchased_item);
                } else {
                  // If no purchased_item, it's a full bundle purchase
                  hasFullBundlePurchase = true;
                }
              }
            });
          });

          // If full bundle was purchased, don't filter (show all files)
          const itemsToShow = hasFullBundlePurchase ? null : (purchasedItemNames.size > 0 ? purchasedItemNames : null);

          const files = data
            .filter((file: any) => file?.name)
            .map((file: any) => {
              const path = `${bundle.products.product_slug}/${file.name}`;
              const filename = file.name;
              const label = filename
                .replace(/\.[^/.]+$/, "")
                .replace(/[-_]+/g, " ")
                .replace(/\d+/g, "")
                .trim();
              const { data: publicUrlData } = client.storage
                .from(
                  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
                    "bundle-files",
                )
                .getPublicUrl(path);

              return {
                label: label || filename,
                name: filename,
                type: file.metadata?.contentType || "application/octet-stream",
                size: file.size || 0,
                path,
                url: publicUrlData?.publicUrl,
              };
            });

          return { id: bundle.id, files, purchasedItems: itemsToShow ? Array.from(itemsToShow) : null };
        }),
      );

      setBundleFilesMap((prev) => ({
        ...prev,
        ...bundleFiles.reduce(
          (acc, curr) => {
            if (curr.files.length > 0) {
              acc[curr.id] = curr.files;
            }
            return acc;
          },
          {} as Record<string, any[]>,
        ),
      }));
    };

    fetchBundleFiles();
  }, [activeBundles]);

  const activeBundlesWithFiles = useMemo(
    () =>
      activeBundles.map((bundle) => {
        const metadataFiles = bundle.products?.metadata?.files;
        const storedFiles = bundleFilesMap[bundle.id] || [];
        const allFiles =
          Array.isArray(metadataFiles) && metadataFiles.length > 0
            ? metadataFiles
            : storedFiles;

        // Don't filter here - filtering happens in the render section based on purchased_items
        return {
          ...bundle,
          bundleFiles: allFiles,
        };
      }),
    [activeBundles, bundleFilesMap],
  );

  const totalResources = useMemo(
    () =>
      activeBundlesWithFiles.reduce(
        (sum, bundle) => sum + (bundle.bundleFiles?.length || 0),
        0,
      ),
    [activeBundlesWithFiles],
  );

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      await Swal.fire({
        icon: "error",
        title: "Password mismatch",
        text: "New password and confirmation do not match.",
        background: "#ffffff",
        color: "#0f172a",
      });
      return;
    }

    if (newPassword.length < 6) {
      await Swal.fire({
        icon: "error",
        title: "Choose a stronger password",
        text: "Password must be at least 6 characters.",
        background: "#ffffff",
        color: "#0f172a",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await updatePassword(currentPassword, newPassword);
      if (error) {
        throw error;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      await Swal.fire({
        icon: "success",
        title: "Password updated",
        text: "Your password has been changed successfully.",
        timer: 2200,
        showConfirmButton: false,
        background: "#ffffff",
        color: "#0f172a",
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Unable to update password",
        text: err?.message || "Please try again.",
        background: "#ffffff",
        color: "#0f172a",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const quickStats = [
    {
      label: "Bundles active",
      value: activeBundles.length,
      icon: Sparkles,
      color: "bg-lime-100 text-lime-700",
    },
    {
      label: "Purchases",
      value: purchases.length,
      icon: CreditCard,
      color: "bg-sky-100 text-sky-700",
    },
    {
      label: "Resources",
      value: totalResources,
      icon: DownloadCloud,
      color: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 md:pt-28 pt-32 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl bg-linear-to-br from-emerald-900 via-slate-950 to-slate-900 px-6 py-8 shadow-[0_30px_120px_rgba(15,23,42,0.25)] sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm tracking-[0.18em] text-emerald-200 backdrop-blur">
                <User className="h-4 w-4" /> Customer Dashboard
              </span>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome back, {profile?.first_name || "Customer"}
              </h1>
              <p className="mt-4 max-w-2xl text-base text-emerald-100">
                Your purchased bundles and secure downloads are ready.
                Everything you own is organized in one modern command center.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-md bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Available now
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {totalResources}
                </p>
                <p className="mt-2 text-sm text-emerald-200">
                  Protected downloads in your purchased bundles
                </p>
              </div>
              <div className="rounded-md bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Active bundles
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {activeBundles.length}
                </p>
                <p className="mt-2 text-sm text-emerald-200">
                  Bundle access granted by purchase
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.3fr_0.85fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${stat.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    Bundle access
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Purchased bundles
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> Secure by purchase
                </div>
              </div>

              {activeBundles.length === 0 ? (
                <div className="mt-10 rounded-md border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Package className="mx-auto h-14 w-14 rounded-md bg-slate-900/5 p-3 text-slate-900" />
                  <h3 className="mt-6 text-xl font-semibold text-slate-950">
                    No bundle purchases yet
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Purchase a bundle and your secure downloads will appear here
                    instantly.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Explore bundles
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-5">
                  {activeBundlesWithFiles.map((userProduct) => {
                    const files = userProduct.bundleFiles || [];
                    // Use purchased_items directly from user_products table
                    const purchasedItems = userProduct.purchased_items || [];
                    
                    // Determine if this is an individual purchase or full bundle
                    const isIndividualPurchase = purchasedItems && purchasedItems.length > 0;
                    const purchaseTypeLabel = isIndividualPurchase 
                      ? "Individual File"
                      : (userProduct.products?.product_label ||
                        userProduct.products?.metadata?.productLabel ||
                        userProduct.products?.type);
                    
                    // If individual purchase, show the item name(s)
                    let displayTitle = userProduct.products.name;
                    if (isIndividualPurchase && purchasedItems && purchasedItems.length > 0) {
                      if (purchasedItems.length === 1) {
                        displayTitle = purchasedItems[0];
                      } else {
                        displayTitle = `${purchasedItems.length} Selected Items`;
                      }
                    }

                    return (
                      <div
                        key={userProduct.id}
                        className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 shadow-sm"
                      >
                        <div className="bg-linear-to-r from-emerald-900 to-slate-950 px-6 py-5 text-white">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="inline-flex rounded-md bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                                {purchaseTypeLabel}
                              </span>
                              <h3 className="mt-4 text-2xl font-semibold">
                                {displayTitle}
                              </h3>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-200 capitalize">
                                {userProduct.products.description}
                              </p>
                            </div>
                            {/* <div className="rounded-md bg-white/10 px-4 py-3 text-sm font-semibold text-emerald-100 ring-1 ring-white/10">
                              Purchased bundle
                            </div> */}
                          </div>
                        </div>
                        <div className="p-6 bg-emerald-50">
                          {/* <div className="grid gap-3 sm:grid-cols-2 mb-4">
                            {userProduct.products.features
                              ?.slice(0, 3)
                              .map((feature: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 rounded-md bg-white px-4 py-4 shadow-sm"
                                >
                                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 text-sm font-semibold">
                                    {index + 1}
                                  </div>
                                  <p className="text-sm text-slate-700">
                                    {feature}
                                  </p>
                                </div>
                              ))}
                          </div> */}

                          {files.length > 0 ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-5 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    {isIndividualPurchase ? "Individual File" : "Bundle"} Downloads
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    Download {isIndividualPurchase ? "the file" : "every file"} included in this
                                    purchase.
                                  </p>
                                </div>
                                <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                  {files.length} file
                                  {files.length === 1 ? "" : "s"} ready
                                </span>
                              </div>
                              <div className="mt-5 grid gap-3">
                                {files.map((file: any, index: number) => {
                                  const fileLabel = normalizeBundleFileLabel(
                                    file.label || file.name || `Resource ${index + 1}`,
                                  ) || `Resource ${index + 1}`;
                                  const fileSize = file.size
                                    ? `${(file.size / 1024).toFixed(1)} KB`
                                    : null;
                                  const fileType = file.type || "Download";

                                  // Check if this file was purchased
                                  // If no purchased_items (complete bundle), all files are purchased
                                  // If purchased_items exists (individual purchase), check if this file is in the list
                                  const isPurchased = !purchasedItems || purchasedItems.length === 0
                                    ? true // Complete bundle - all files purchased
                                    : purchasedItems.some((item: string) => {
                                        const itemLabel = item.toLowerCase().trim();
                                        const normalizedLabel = fileLabel.toLowerCase().trim();
                                        return normalizedLabel === itemLabel || 
                                               normalizedLabel.includes(itemLabel.replace(/\s+/g, "")) ||
                                               itemLabel.includes(normalizedLabel.replace(/\s+/g, ""));
                                      });

                                  if (isPurchased) {
                                    // Show download button for purchased files
                                    return (
                                      <a
                                        key={`${userProduct.id}-${index}`}
                                        href={file.url || file.path || "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={Boolean(file.url)}
                                        className="group flex flex-col gap-3 rounded-md border border-emerald-200 bg-white px-4 py-4 transition hover:border-emerald-400 hover:bg-emerald-50 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-950 capitalize">
                                            {fileLabel}
                                          </p>
                                          <p className="text-xs text-emerald-600 font-medium mt-1">✓ Purchased</p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-emerald-800">
                                          <DownloadCloud className="h-4 w-4" />
                                          Download
                                        </span>
                                      </a>
                                    );
                                  } else {
                                    // Show disabled state for unpurchased files
                                    return (
                                      <div
                                        key={`${userProduct.id}-${index}`}
                                        className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4 opacity-70 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-600 capitalize">
                                            {fileLabel}
                                          </p>
                                          <p className="text-xs text-red-500 font-medium mt-1">✗ You didn't purchase this file</p>
                                        </div>
                                        <button
                                          disabled
                                          className="inline-flex items-center gap-2 rounded-md bg-slate-400 px-3 py-2 text-xs font-semibold text-white cursor-not-allowed opacity-60"
                                        >
                                          <DownloadCloud className="h-4 w-4" />
                                          Locked
                                        </button>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-6 rounded-md border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                              <p className="font-semibold text-slate-900">
                                No downloadable files found
                              </p>
                              <p className="mt-2">
                                This purchase doesn't include file downloads.
                                Contact support to enable your resources.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {profile?.first_name || user.email}
                  </h2>
                </div>
                <div className="rounded-md bg-emerald-100 p-3 text-emerald-900">
                  <User className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Email</p>
                  <p className="mt-1 break-all">{user.email}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-md bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Joined</p>
                    <p className="mt-1 text-slate-600">
                      {new Date(
                        user.created_at || Date.now(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Status</p>
                    <p className="mt-1 text-emerald-700">Active member</p>
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900 text-sm">
                    Current password
                  </p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    Enter the password you set when creating your account.
                  </p>
                  <div className="relative mt-2">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-12 text-[10px] text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-md bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900 text-sm">New password</p>
                    <div className="relative mt-2">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-12 text-[10px] text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-emerald-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900 text-sm">
                      Confirm new password
                    </p>
                    <div className="relative mt-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-12 text-[10px] text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-emerald-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={savingPassword}
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? "Saving..." : "Update password"}
                </button>
              </div>
            </div>

            {/* <div className="rounded-md border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Support
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Need help?
                  </h2>
                </div>
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-600 grid md:grid-cols-2 gap-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Secure downloads
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Access only the files attached to your purchased bundle.
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Contact support
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Email support@example.com for resource or account questions.
                  </p>
                </div>
              </div>
            </div> */}
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-2xl">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Purchase activity
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Recent transactions
                </h2>
              </div>

              <div className="mt-6 max-h-150 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 pr-3">
                <div className="sticky top-0 grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 px-5 py-4 text-[9px] uppercase tracking-[0.22em] text-slate-400 sm:grid-cols-4">
                  <span>Order</span>
                  <span>Date</span>
                  <span>Total</span>
                  <span>Status</span>
                </div>
                <div className="space-y-3 px-5 pb-5 pt-2 max-h-40 overflow-y-auto">
                  {purchases.length > 0 ? (
                    purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="grid grid-cols-2 items-center gap-x-6 gap-y-3 rounded-md bg-white px-3 py-2.5 shadow-sm sm:grid-cols-4"
                      >
                        <div className="font-medium text-slate-900 text-xs">
                          #{purchase.id.slice(-8)}
                        </div>
                        <div className="text-xs text-slate-600">
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          ${purchase.amount?.toFixed(2)}
                        </div>
                        <div className="inline-flex max-w-max items-center text-[9px] font-semibold text-emerald-700">
                          {purchase.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-sm text-slate-600">
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
