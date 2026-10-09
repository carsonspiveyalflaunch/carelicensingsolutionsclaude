"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Layers,
  LogOut,
  Menu,
  Package,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
  User2Icon,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../components/AuthContext";
import Pagination from "../components/Pagination";
import AdminLoginClient from "./AdminLoginClient";
import AdminSidebar from "../components/AdminSidebar";
import BundleCard from "../components/BundleCard";
import type { BundleProduct, BundleFormPayload } from "@/lib/bundles";
import {
  createAdminBundle,
  deleteAdminBundle,
  fetchAdminBundle,
  fetchAdminBundles,
  updateAdminBundle,
  uploadBundleFiles,
} from "@/lib/bundles";
import { states, programCategories, statePrograms } from "@/app/data/shopData";

interface AdminStats {
  productsCount: number;
  coursesCount: number;
  bundlesCount: number;
  purchasesCount: number;
  usersCount: number;
  accessCount: number;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_admin?: boolean | null;
  created_at?: string | null;
  is_active?: boolean;
}

export default function AdminPanelClient() {
  const router = useRouter();
  const {
    user,
    profile,
    isAdmin,
    loading,
    profileStatus,
    signOut,
    updateProfile,
  } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showError = (message: string) => {
    setError(message);
    Swal.fire({
      icon: "error",
      title: "Oops!",
      text: message,
      timer: 3500,
      timerProgressBar: true,
      showConfirmButton: false,
      background: "#ffffff",
      color: "#0f172a",
    });
  };
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeSection, setActiveSection] = useState<
    | "Overview"
    | "Bundles"
    | "Upload Bundle"
    | "Upload Individual Bundle"
    | "Users"
    | "Profile Settings"
  >("Overview");
  const [bundles, setBundles] = useState<BundleProduct[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleProduct | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bundle upload labels
  const fileUploadLabels = [
    "Market Research Report",
    "Pro Forma P&L Template",
    "Policy & Procedure Manual",
    "Licensing Checklist",
  ];

  // Individual Bundle upload labels (same as bundle but with is_individual flag)
  const individualFileUploadLabels = [
    "Market Research Report",
    "Pro Forma P&L Template",
    "Policy & Procedure Manual",
    "Licensing Checklist",
  ];

  type BundleFileInfo = {
    file: File | null;
    name: string;
    type: string;
    size: number;
    url?: string;
    path?: string;
  };

  const emptyBundleFiles = fileUploadLabels.reduce(
    (acc, label) => ({
      ...acc,
      [label]: {
        file: null,
        name: "",
        type: "",
        size: 0,
        url: undefined,
        path: undefined,
      },
    }),
    {} as Record<string, BundleFileInfo>,
  );

  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    price: "",
    state: "",
    program: "",
    productLabel: "Complete Bundle",
  });
  const [bundleFiles, setBundleFiles] =
    useState<Record<string, BundleFileInfo>>(emptyBundleFiles);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [bundleUploadProgress, setBundleUploadProgress] = useState(0);
  const [isSavingBundle, setIsSavingBundle] = useState(false);

  // Individual Bundle Form State
  const emptyIndividualBundleFiles = individualFileUploadLabels.reduce(
    (acc, label) => ({
      ...acc,
      [label]: {
        file: null,
        name: "",
        type: "",
        size: 0,
        url: undefined,
        path: undefined,
      },
    }),
    {} as Record<string, BundleFileInfo>,
  );

  const [individualBundleForm, setIndividualBundleForm] = useState({
    state: "",
  });
  const [individualBundleFiles, setIndividualBundleFiles] = useState<
    Record<string, BundleFileInfo>
  >(emptyIndividualBundleFiles);
  const [isUploadingIndividualFiles, setIsUploadingIndividualFiles] =
    useState(false);
  const [individualUploadProgress, setIndividualUploadProgress] =
    useState(0);
  const [isSavingIndividualBundle, setIsSavingIndividualBundle] =
    useState(false);
  const [individualBundleFormOpen, setIndividualBundleFormOpen] =
    useState(false);

  // Auto-generate bundle name from state + program + product label (only for new bundles)
  useEffect(() => {
    if (
      !editingBundle &&
      bundleForm.state &&
      bundleForm.program &&
      bundleForm.productLabel
    ) {
      const generatedName = `${bundleForm.state} ${bundleForm.program} ${bundleForm.productLabel}`;
      setBundleForm((prev) => ({
        ...prev,
        name: generatedName,
      }));
    }
  }, [
    bundleForm.state,
    bundleForm.program,
    bundleForm.productLabel,
    editingBundle,
  ]);

  useEffect(() => {
    let intervalId: number | undefined;
    let resetTimeout: number | undefined;

    if (isUploadingFiles) {
      setBundleUploadProgress(12);
      intervalId = window.setInterval(() => {
        setBundleUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 320);
    } else if (bundleUploadProgress > 0) {
      setBundleUploadProgress(100);
      resetTimeout = window.setTimeout(() => {
        setBundleUploadProgress(0);
      }, 600);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (resetTimeout) window.clearTimeout(resetTimeout);
    };
  }, [isUploadingFiles]);

  useEffect(() => {
    let intervalId: number | undefined;
    let resetTimeout: number | undefined;

    if (isUploadingIndividualFiles) {
      setIndividualUploadProgress(12);
      intervalId = window.setInterval(() => {
        setIndividualUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 320);
    } else if (individualUploadProgress > 0) {
      setIndividualUploadProgress(100);
      resetTimeout = window.setTimeout(() => {
        setIndividualUploadProgress(0);
      }, 600);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (resetTimeout) window.clearTimeout(resetTimeout);
    };
  }, [isUploadingIndividualFiles]);

  // Helper function to generate features from state
  const generateFeatures = (stateName: string): string[] => {
    return [
      `${stateName}-specific licensing and compliance guidance`,
      "Editable policies, procedures, and forms",
      "State regulation checklist",
      "Application and inspection support",
      "Renewal readiness resources",
    ];
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [bundleSearch, setBundleSearch] = useState("");
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pageSize = 8;

  useEffect(() => {
    if (!loading && !user && !isSigningOut) {
      router.replace("/404");
    }

    if (!loading && user && profileStatus === "success" && !isAdmin) {
      router.replace("/404");
    }
  }, [loading, user, profileStatus, isAdmin, isSigningOut, router]);

  // Mount effect - only set mounted flag once
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle loading timeout to prevent indefinite loading
  useEffect(() => {
    if (!loading) {
      setLoadingTimeout(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 8000); // Show timeout warning after 8 seconds

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Reset state when user logs out or auth state changes
  useEffect(() => {
    if (!isAdmin && mounted) {
      // Reset all loading states
      setLoadingStats(false);
      setLoadingBundles(false);
      setLoadingUsers(false);
      setStats(null);
      setBundles([]);
      setUsers([]);
      setError(null);
      setBundleFormOpen(false);
      setActiveSection("Overview");
    }
  }, [isAdmin, mounted]);

  // Reset profile form when profile updates
  useEffect(() => {
    setProfileForm({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
    });
  }, [profile]);

  // Populate the edit form whenever an existing bundle is selected
  useEffect(() => {
    if (!editingBundle) return;

    setBundleForm({
      name: editingBundle.name || "",
      description: editingBundle.description || "",
      price: String(editingBundle.price ?? ""),
      state: editingBundle.metadata?.state ?? editingBundle.state ?? "",
      program: editingBundle.metadata?.program ?? editingBundle.program ?? "",
      productLabel:
        editingBundle.metadata?.productLabel ??
        editingBundle.product_label ??
        "Complete Bundle",
    });

    const loadedFiles = { ...emptyBundleFiles };
    if (Array.isArray(editingBundle.metadata?.files)) {
      editingBundle.metadata.files.forEach((file: any) => {
        if (file?.label && file?.name) {
          loadedFiles[file.label] = {
            file: null,
            name: String(file.name),
            type: String(file.type || ""),
            size: Number(file.size || 0),
            url: file.url ?? undefined,
            path: file.path ?? undefined,
          };
        }
      });
    }
    setBundleFiles(loadedFiles);
    setBundleFormOpen(true);
  }, [editingBundle]);

  const filteredBundles = bundles.filter((bundle) => {
    const query = bundleSearch.trim().toLowerCase();
    if (!query) return true;

    const searchable = [
      bundle.name,
      bundle.description,
      bundle.product_slug,
      bundle.product_label,
      bundle.metadata?.state,
      bundle.metadata?.code,
      bundle.metadata?.program,
      bundle.metadata?.productLabel,
      bundle.metadata?.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filteredBundles.length / pageSize));
  const pagedBundles = filteredBundles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedStateCode = states.find(
    (s) => s.name === bundleForm.state,
  )?.code;
  const availableProgramOptions =
    selectedStateCode && statePrograms[selectedStateCode]
      ? statePrograms[selectedStateCode]
      : programCategories;

  const handleLogout = async () => {
    setIsSigningOut(true);
    setLoadingStats(false);
    setLoadingBundles(false);
    setLoadingUsers(false);
    setStats(null);
    setBundles([]);
    setUsers([]);
    setError(null);
    setBundleFormOpen(false);
    setActiveSection("Overview");

    await signOut();
    router.push("/");
  };

  const refreshBundles = async () => {
    setLoadingBundles(true);
    try {
      const bundlesData = await fetchAdminBundles();
      setBundles(bundlesData);
    } catch (err: any) {
      showError(err?.message || "Unable to refresh bundles.");
    } finally {
      setLoadingBundles(false);
    }
  };

  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/profiles");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load user profiles.");
      }

      setUsers(data.users || []);
    } catch (err: any) {
      showError(err?.message || "Unable to load user profiles.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleAccess = async (userId: string, currentlyActive: boolean | undefined) => {
    const action = currentlyActive === false ? 'enable' : 'disable';

    const result = await Swal.fire({
      title: `${action === 'disable' ? 'Disable' : 'Enable'} user?`,
      text: `This will ${action === 'disable' ? 'prevent' : 'allow'} the user from signing in. Continue?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: action === 'disable' ? 'Disable' : 'Enable',
      confirmButtonColor: '#14532d',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/profiles/toggle-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update user');

      // Update local state (API returns is_active)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: json.is_active } : u)));

      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: `User has been ${json.is_active ? 'enabled' : 'disabled'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      showError(err?.message || 'Unable to update user access.');
    }
  };

  const openNewBundleForm = () => {
    setEditingBundle(null);
    setBundleForm({
      name: "",
      description: "",
      price: "",
      state: "",
      program: "",
      productLabel: "Complete Bundle",
    });
    setBundleFiles(emptyBundleFiles);
    setBundleFormOpen(true);
    setActiveSection("Upload Bundle");
  };

  const openNewIndividualBundleForm = () => {
    setIndividualBundleForm({
      state: "",
    });
    setIndividualBundleFiles(emptyIndividualBundleFiles);
    setIndividualBundleFormOpen(true);
    setActiveSection("Upload Individual Bundle");
  };

  const openEditBundleForm = (bundle: BundleProduct) => {
    setEditingBundle(bundle);
    setActiveSection("Upload Bundle");

    setBundleForm({
      name: bundle.name || "",
      description: bundle.description || "",
      price: String(bundle.price ?? ""),
      state: bundle.metadata?.state ?? bundle.state ?? "",
      program: bundle.metadata?.program ?? bundle.program ?? "",
      productLabel:
        bundle.metadata?.productLabel ??
        bundle.product_label ??
        "Complete Bundle",
    });

    const loadedFiles = { ...emptyBundleFiles };
    if (Array.isArray(bundle.metadata?.files)) {
      bundle.metadata.files.forEach((file: any) => {
        if (file?.label && file?.name) {
          loadedFiles[file.label] = {
            file: null,
            name: String(file.name),
            type: String(file.type || ""),
            size: Number(file.size || 0),
            url: file.url ?? undefined,
            path: file.path ?? undefined,
          };
        }
      });
    }
    setBundleFiles(loadedFiles);
    setBundleFormOpen(true);
  };

  const saveBundle = async () => {
    const trimmedName = bundleForm.name.trim();
    if (!trimmedName || bundleForm.price === "" || !bundleForm.state) {
      showError("Bundle name, price, and state are required.");
      return;
    }

    setError(null);
    setIsSavingBundle(true);

    // Get state data from the selected state name
    const selectedState = states.find((s) => s.name === bundleForm.state);
    const stateCode = selectedState?.code || "";

    // Use the state flag URL from the state data rather than a local image path
    const flagUrl = selectedState?.flag || "";

    // Auto-generate features from state
    const autoFeatures = generateFeatures(bundleForm.state);

    // Auto-generate product slug.
    // For complete bundles, include state + program + product label to ensure uniqueness
    const slugSource =
      bundleForm.productLabel === "Complete Bundle"
        ? `${bundleForm.state} ${bundleForm.program} ${bundleForm.productLabel}`
        : trimmedName;
    const autoSlug = slugify(slugSource);
    const bundleSlug = editingBundle?.product_slug ?? autoSlug;

    let uploadedFiles: Array<{
      label: string;
      name: string;
      type: string;
      size: number;
      url?: string;
      path?: string;
    }> = [];
    const rawFiles = Object.entries(bundleFiles).filter(
      ([, fileInfo]) => fileInfo?.file,
    );

    if (rawFiles.length > 0) {
      setIsUploadingFiles(true);
      try {
        const formData = new FormData();
        rawFiles.forEach(([label, fileInfo]) => {
          if (fileInfo?.file) {
            formData.append("files", fileInfo.file, fileInfo.file.name);
            formData.append("labels", label);
          }
        });
        formData.append("bundleSlug", bundleSlug);

        uploadedFiles = await uploadBundleFiles(formData);
      } catch (err: any) {
        showError(err?.message || "Unable to upload bundle files.");
        setIsUploadingFiles(false);
        setIsSavingBundle(false);
        return;
      } finally {
        setIsUploadingFiles(false);
      }
    }

    const filesMetadata = Object.entries(bundleFiles)
      .map(([label, fileInfo]) => {
        if (!fileInfo) return null;

        if (fileInfo.file) {
          return (
            uploadedFiles.find((item) => item.label === label) ?? {
              label,
              name: fileInfo.file.name,
              type: fileInfo.file.type,
              size: fileInfo.file.size,
            }
          );
        }

        if (fileInfo.name) {
          return {
            label,
            name: fileInfo.name,
            type: fileInfo.type,
            size: fileInfo.size,
            url: fileInfo.url,
            path: fileInfo.path,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      label: string;
      name: string;
      type: string;
      size: number;
      url?: string;
      path?: string;
    }>;

    const payload = {
      name: trimmedName,
      product_slug: autoSlug,
      description: bundleForm.description,
      price: Number(bundleForm.price),
      state: bundleForm.state,
      code: stateCode,
      program: bundleForm.program || undefined,
      product_label: bundleForm.productLabel,
      tags: bundleForm.program ? [bundleForm.program] : [],
      metadata: {
        state: bundleForm.state,
        code: stateCode,
        program: bundleForm.program,
        productLabel: bundleForm.productLabel,
        bestValue: true,
        tags: bundleForm.program ? [bundleForm.program] : [],
        format: "PDF Format",
        download: true,
        flag: flagUrl,
        logo: "",
        year: new Date().getFullYear(),
        status: "Active",
        quantity: 0,
        files: filesMetadata,
      },
      features: autoFeatures,
      is_active: true,
    };

    try {
      if (editingBundle) {
        await updateAdminBundle(editingBundle.id, payload);
      } else {
        await createAdminBundle(payload as BundleFormPayload);
      }
      setBundleFormOpen(false);
      setEditingBundle(null);
      await refreshBundles();

      await Swal.fire({
        icon: "success",
        title: "Bundle Uploaded",
        text: "Your bundle was saved successfully. Returning to Upload Bundle...",
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: "#f3faf1",
        color: "#0f172a",
        iconColor: "#16a34a",
      });

      setActiveSection("Upload Bundle");
      setBundleFormOpen(true);
      setBundleForm({
        name: "",
        description: "",
        price: "",
        state: "",
        program: "",
        productLabel: "Complete Bundle",
      });
      setBundleFiles(emptyBundleFiles);
    } catch (err: any) {
      showError(err?.message || "Unable to save bundle.");
    } finally {
      setIsSavingBundle(false);
    }
  };

  const saveIndividualBundle = async () => {
    if (!individualBundleForm.state) {
      showError("State is required for individual bundle.");
      return;
    }

    setError(null);
    setIsSavingIndividualBundle(true);

    // Get state data from the selected state name
    const selectedState = states.find(
      (s) => s.name === individualBundleForm.state,
    );
    const stateCode = selectedState?.code || "";
    const flagUrl = selectedState?.flag || "";

    let uploadedFiles: Array<{
      label: string;
      name: string;
      type: string;
      size: number;
      url?: string;
      path?: string;
    }> = [];

    const rawFiles = Object.entries(individualBundleFiles).filter(
      ([, fileInfo]) => fileInfo?.file,
    );

    if (rawFiles.length > 0) {
      setIsUploadingIndividualFiles(true);
      try {
        const formData = new FormData();
        rawFiles.forEach(([label, fileInfo]) => {
          if (fileInfo?.file) {
            formData.append("files", fileInfo.file, fileInfo.file.name);
            formData.append("labels", label);
          }
        });
        const stateSlug = slugify(individualBundleForm.state);
        formData.append("bundleSlug", `${stateSlug}-individual-bundle`);

        uploadedFiles = await uploadBundleFiles(formData);
      } catch (err: any) {
        showError(err?.message || "Unable to upload individual bundle files.");
        setIsUploadingIndividualFiles(false);
        setIsSavingIndividualBundle(false);
        return;
      } finally {
        setIsUploadingIndividualFiles(false);
      }
    }

    const filesMetadata = Object.entries(individualBundleFiles)
      .map(([label, fileInfo]) => {
        if (!fileInfo) return null;

        if (fileInfo.file) {
          return (
            uploadedFiles.find((item) => item.label === label) ?? {
              label,
              name: fileInfo.file.name,
              type: fileInfo.file.type,
              size: fileInfo.file.size,
            }
          );
        }

        if (fileInfo.name) {
          return {
            label,
            name: fileInfo.name,
            type: fileInfo.type,
            size: fileInfo.size,
            url: fileInfo.url,
            path: fileInfo.path,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      label: string;
      name: string;
      type: string;
      size: number;
      url?: string;
      path?: string;
    }>;

    const bundleName = `${individualBundleForm.state} Individual Bundle`;
    const bundleSlug = slugify(bundleName);

    const payload = {
      name: bundleName,
      product_slug: bundleSlug,
      description: `Individual care business bundle for ${individualBundleForm.state}`,
      price: 0,
      state: individualBundleForm.state,
      code: stateCode,
      product_label: "Individual Bundle",
      tags: [],
      metadata: {
        state: individualBundleForm.state,
        code: stateCode,
        program: "",
        productLabel: "Individual Bundle",
        bestValue: false,
        tags: [],
        format: "PDF Format",
        download: true,
        flag: flagUrl,
        logo: "",
        year: new Date().getFullYear(),
        status: "Active",
        quantity: 0,
        files: filesMetadata,
        is_individual: true,
      },
      features: [
        `${individualBundleForm.state} care business essentials`,
        "Editable templates and checklists",
        "State compliance guidelines",
        "Ready-to-use business documents",
      ],
      is_active: true,
      is_individual: true,
    };

    try {
      await createAdminBundle(payload as BundleFormPayload);
      setIndividualBundleFormOpen(false);
      setIndividualBundleForm({ state: "" });
      setIndividualBundleFiles(emptyIndividualBundleFiles);
      await refreshBundles();
      Swal.fire({
        icon: "success",
        title: "Individual bundle created",
        text: `${bundleName} has been published successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      showError(err?.message || "Unable to save individual bundle.");
    } finally {
      setIsSavingIndividualBundle(false);
    }
  };

  const saveProfile = async () => {
    if (!updateProfile) {
      showError("Unable to update profile.");
      return;
    }

    setError(null);
    setSavingProfile(true);
    try {
      const { error } = await updateProfile({
        first_name: profileForm.first_name || null,
        last_name: profileForm.last_name || null,
      });
      if (error) {
        throw error;
      }
      Swal.fire({
        icon: "success",
        title: "Profile updated",
        text: "Your admin profile has been saved.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      showError(err?.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    const result = await Swal.fire({
      title: "Delete this bundle?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#14532d",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "rounded-[1rem] border border-emerald-100",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteAdminBundle(bundleId);
      await refreshBundles();
      await Swal.fire({
        title: "Deleted!",
        text: "The bundle was removed successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      showError(err?.message || "Unable to delete bundle.");
    }
  };

  const previewBundle: BundleProduct = {
    id: editingBundle?.id || "preview",
    name: bundleForm.name || "Bundle preview",
    description:
      bundleForm.description ||
      "Preview your selected state and program before saving.",
    price: Number(bundleForm.price) || 0,
    type: "bundle",
    product_slug: slugify(bundleForm.name || "preview-bundle"),
    features: bundleForm.state ? generateFeatures(bundleForm.state) : [],
    metadata: {
      status: "Active",
      quantity: 0,
      state: bundleForm.state,
      code: states.find((s) => s.name === bundleForm.state)?.code || "",
      program: bundleForm.program,
      productLabel: bundleForm.productLabel,
      bestValue: true,
      tags: bundleForm.program ? [bundleForm.program] : [],
      format: "PDF Format",
      download: true,
      flag: states.find((s) => s.name === bundleForm.state)?.flag || "",
      logo: "",
      year: new Date().getFullYear(),
      files: Object.entries(bundleFiles)
        .filter(([, file]) => file)
        .map(([label, file]) => ({
          label,
          name: file!.name,
          type: file!.type,
          size: file!.size,
        })),
    },
  };

  useEffect(() => {
    if (!isAdmin || !mounted) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      const timeoutId = setTimeout(() => {
        if (loadingStats) {
          setLoadingStats(false);
          showError("Failed to load admin stats. Please refresh the page.");
        }
      }, 10000); // 10 second timeout

      try {
        const response = await fetch("/api/admin-stats");
        clearTimeout(timeoutId); // Clear timeout on success
        if (!response.ok) {
          throw new Error("Unable to load admin stats.");
        }
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        clearTimeout(timeoutId); // Clear timeout on error
        showError(err?.message || "Unable to load admin stats.");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [isAdmin, mounted]);

  useEffect(() => {
    const fetchBundles = async () => {
      setLoadingBundles(true);
      try {
        const bundlesData = await fetchAdminBundles();
        setBundles(bundlesData);
      } catch (err: any) {
        showError(err?.message || "Unable to load bundles.");
      } finally {
        setLoadingBundles(false);
      }
    };

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch("/api/admin/profiles");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load user profiles.");
        }

        setUsers(data.users || []);
      } catch (err: any) {
        showError(err?.message || "Unable to load user profiles.");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isAdmin && mounted) {
      fetchBundles();
      loadUsers();
    }
  }, [isAdmin, mounted]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bundleSearch]);

  useEffect(() => {
    if (bundles.length > 0 && currentPage === 0) {
      setCurrentPage(1);
    }
  }, [bundles.length, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8f6] flex items-center justify-center px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-10 shadow-[0_30px_80px_rgba(15,57,34,0.12)] text-center max-w-md">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-emerald-50 mb-4">
              <div className="animate-spin">
                <RefreshCcw className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              Checking admin access...
            </p>
          </div>

          {loadingTimeout ? (
            <div className="space-y-4 hidden">
              <p className="text-sm text-slate-600">
                This is taking longer than expected. Your session may need to be
                refreshed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  <RefreshCcw className="w-4 h-4 inline mr-2" />
                  Reload Page
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Go Home
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Loading your admin dashboard...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user && profileStatus !== "success") {
    return (
      <div className="min-h-screen bg-[#f5f8f6] flex items-center justify-center px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,57,34,0.12)] text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-emerald-50 mb-3">
            <div className="animate-spin">
              <RefreshCcw className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f8f6] pt-28 pb-10">
      <div className="fixed left-0 right-0 top-0 z-30 flex w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm md:left-[280px] md:w-[calc(100%-280px)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="text-lg font-semibold text-slate-950">
              Care Licensing Solutions
            </h1>
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-md text-center md:text-sm border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                View storefront
              </Link>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800">
              <User className="h-4 w-4" />
              {profile?.first_name || user?.email
                ? `${profile?.first_name ?? ""}${profile?.last_name ? ` ${profile.last_name}` : user?.email ? ` ${user.email}` : ""}`.trim()
                : "Admin"}
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full md:pl-[280px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="">
            <AdminSidebar
              activeSection={activeSection}
              onSelectSection={(section) => {
                if (section === "Upload Bundle") {
                  openNewBundleForm();
                } else if (section === "Upload Individual Bundle") {
                  openNewIndividualBundleForm();
                } else {
                  setActiveSection(section);
                }
                setSidebarOpen(false);
              }}
              onLogout={handleLogout}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <main className="space-y-6">
              {activeSection === "Overview" && (
                <>
                  <div className="rounded-lg border border-emerald-200 bg-linear-to-br from-[#eef8f2] via-[#f8fffb] to-[#eff7ee] p-8 shadow-[0_25px_80px_rgba(15,57,34,0.12)] mb-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-md bg-emerald-900/10 px-4 py-2 text-sm font-semibold text-emerald-900">
                          <User2Icon className="h-4 w-4 inline" /> Admin Panel
                        </div>
                        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                          Admin Control Center
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700">
                          Manage bundles, access, and resources with a clean
                          modern interface built to match your current theme.
                        </p>
                        {/* <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-md bg-white px-4 py-2 font-semibold text-slate-900 shadow-sm">Current section: {activeSection}</span>
                      </div> */}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={openNewBundleForm}
                          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-[#2F5D46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#254A38]"
                        >
                          Upload Bundle
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection("Bundles")}
                          className="cursor-pointer inline-flex items-center justify-center rounded-md border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          Manage Bundles
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl w-full">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="md:text-sm text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            Admin stats
                          </p>
                          <h2 className="mt-2 text-2xl font-bold text-slate-950">
                            Live metrics
                          </h2>
                        </div>
                        <div className="rounded-md bg-emerald-100 p-3 text-emerald-900">
                          <Users className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        {[
                          {
                            label: "Total products",
                            value: stats?.productsCount ?? 0,
                            icon: Package,
                            accent: "bg-gray-50 text-emerald-700",
                          },
                          {
                            label: "Total users",
                            value: stats?.usersCount ?? 0,
                            icon: Users,
                            accent: "bg-gray-50 text-emerald-700",
                          },
                          {
                            label: "Completed purchases",
                            value: stats?.purchasesCount ?? 0,
                            icon: Sparkles,
                            accent: "bg-gray-50 text-emerald-700",
                          },
                        ].map((metric) => {
                          const Icon = metric.icon;
                          return (
                            <div
                              key={metric.label}
                              className="rounded-lg flex flex-col items-center justify-center border border-white bg-linear-to-br from-[#e1f4e8] transition-all hover:border-emerald-200 via-[#d1f5e1] to-[#eff7ee] p-6 hover:shadow-xl shadow-[0_18px_50px_rgba(15,57,34,0.08)]"
                            >
                              <div
                                className={`inline-flex items-center justify-center rounded-md p-3 ${metric.accent}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <p className="mt-4 text-sm text-center font-medium text-slate-500">
                                {metric.label}
                              </p>
                              <p className="mt-2 text-3xl font-semibold text-slate-950">
                                {metric.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl w-full">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Operations
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-950">
                          Admin access overview
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
                        <ShieldCheck className="h-4 w-4 inline" /> Admin
                        features enabled
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {[
                        {
                          title: "Bundle Management",
                          description:
                            "Effortlessly create, update, and manage bundles directly from the dashboard.",
                          icon: Layers,
                        },
                        {
                          title: "User Registrations from Website",
                          description:
                            "Access and review user registrations along with their detailed profile information.",
                          icon: Users,
                        },
                        {
                          title: "Profile Management",
                          description:
                            "Manage and update your admin profile information and account preferences.",
                          icon: User2Icon,
                        },
                        {
                          title: "Access Control",
                          description:
                            "Control admin-level permissions and ensure the security of system settings.",
                          icon: ShieldCheck,
                        },
                      ].map((card) => {
                        const Icon = card.icon;
                        return (
                          <div
                            key={card.title}
                            className="rounded-md border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-slate-300 hover:bg-white"
                          >
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-emerald-800 shadow-sm">
                              <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-950">
                              {card.title}
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {card.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {activeSection === "Bundles" && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl w-full">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Bundles
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-950">
                          Bundle management
                        </h2>
                        <p className="mt-2 text-slate-600">
                          Create, update, and delete bundle offerings directly
                          from the admin dashboard.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={openNewBundleForm}
                          className="rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                        >
                          New bundle
                        </button>
                        <button
                          type="button"
                          onClick={refreshBundles}
                          className="cursor-pointer rounded-md border border-emerald-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                          <RefreshCcw className="h-4 w-4 inline" /> Refresh list
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <label className="block text-sm font-semibold text-slate-700">
                            Search bundles
                          </label>
                          <p className="text-sm text-slate-500">
                            {bundleSearch
                              ? `Showing ${filteredBundles.length} matching bundles`
                              : `${bundles.length} bundles available`}
                          </p>
                        </div>
                        <input
                          value={bundleSearch}
                          onChange={(event) =>
                            setBundleSearch(event.target.value)
                          }
                          placeholder="Search by name, code, state, or tag"
                          className="mt-2 w-full min-w-0 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700">
                    <div className="space-y-4 md:px-5 px-2 pb-5 pt-2 overflow-x-auto">
                      {loadingBundles ? (
                        <div className="rounded-md bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm">
                          Loading bundles...
                        </div>
                      ) : bundles.length === 0 ? (
                        <div className="rounded-md bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm">
                          No bundles found. Create one to get started.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {pagedBundles.map((bundle) => (
                            <BundleCard
                              key={bundle.id}
                              bundle={bundle}
                              // footerLabel={`Status: ${bundle.metadata?.status ?? "Active"} · Qty: ${bundle.metadata?.quantity ?? "—"}`}
                              onAction={() => openEditBundleForm(bundle)}
                              actionLabel="Edit Bundle"
                              variant="admin"
                              actions={
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditBundleForm(bundle)}
                                    className="cursor-pointer rounded-md border border-emerald-200 bg-white px-3 py-2 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteBundle(bundle.id)}
                                    className="cursor-pointer rounded-md border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50"
                                  >
                                    Delete
                                  </button>
                                </>
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-6"
                  />
                </div>
              )}
              {activeSection === "Upload Bundle" && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl w-full">
                  {/* <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Upload Bundle
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Bundle upload
                    </h2>
                    <p className="mt-2 text-slate-600">
                      Upload new bundles from a dedicated admin section separate
                      from the bundle list.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={openNewBundleForm}
                      className="rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      New bundle
                    </button>
                  </div>
                </div> */}

                  {bundleFormOpen ? (
                    <div
                      key={editingBundle?.id ?? "new-bundle-form"}
                      className=" space-y-6"
                    >
                      <div className="rounded-[1rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="md:text-sm text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                              {editingBundle ? "Edit bundle" : "Create bundle"}
                            </p>
                            <h3 className="mt-2 md:text-3xl text-2xl font-bold tracking-tight text-slate-950">
                              {editingBundle
                                ? "Update bundle details"
                                : "Add a new bundle"}
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                              Upload state-specific care business bundles with a
                              clean, step-driven interface.
                            </p>
                          </div>
                          {/* <button
                          type="button"
                          onClick={() => setBundleFormOpen(false)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                        >
                          Cancel
                        </button> */}
                        </div>
                      </div>

                      <div className="grid gap-6">
                        <div className="hidden rounded-[1rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white shrink-0">
                              1
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Select State & Program
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Choose the bundle state and related program.
                              </p>
                            </div>
                          </div>
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              States
                              <select
                                value={bundleForm.state}
                                onChange={(event) =>
                                  setBundleForm({
                                    ...bundleForm,
                                    state: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">Select states...</option>
                                {states.map((state) => (
                                  <option key={state.code} value={state.name}>
                                    {state.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                              Program Types
                              <select
                                value={bundleForm.program}
                                onChange={(event) =>
                                  setBundleForm({
                                    ...bundleForm,
                                    program: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">
                                  Select program types...
                                </option>
                                {availableProgramOptions.map((program) => (
                                  <option key={program} value={program}>
                                    {program}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white shrink-0">
                              1
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Bundle details
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Complete the bundle fields.
                              </p>
                            </div>
                          </div>

                          <div className="hidden gap-4 lg:grid-cols-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Bundle name
                              <input
                                value={bundleForm.name}
                                readOnly
                                className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none cursor-not-allowed"
                                placeholder="Select state and program to auto-generate name"
                              />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                              Product label
                              <input
                                value={bundleForm.productLabel}
                                disabled
                                className="mt-2 w-full rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                              />
                            </label>
                          </div>
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              States
                              <select
                                value={bundleForm.state}
                                onChange={(event) =>
                                  setBundleForm({
                                    ...bundleForm,
                                    state: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">Select states...</option>
                                {states.map((state) => (
                                  <option key={state.code} value={state.name}>
                                    {state.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="flex flex-col gap-4 md:flex-row">
                              <label className="block md:w-[60%] w-full text-sm font-semibold text-slate-700">
                                Program Types
                                <select
                                  value={bundleForm.program}
                                  onChange={(event) =>
                                    setBundleForm({
                                      ...bundleForm,
                                      program: event.target.value,
                                    })
                                  }
                                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                >
                                  <option value="">
                                    Select program types...
                                  </option>
                                  {availableProgramOptions.map((program) => (
                                    <option key={program} value={program}>
                                      {program}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block md:w-[37%] w-full text-sm font-semibold text-slate-700">
                                Price
                                <input
                                  value={bundleForm.price}
                                  onChange={(event) =>
                                    setBundleForm({
                                      ...bundleForm,
                                      price: event.target.value,
                                    })
                                  }
                                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Enter price"
                                />
                              </label>
                            </div>
                            <label className="lg:col-span-2 block text-sm font-semibold text-slate-700">
                              Description
                              <textarea
                                value={bundleForm.description}
                                onChange={(event) =>
                                  setBundleForm({
                                    ...bundleForm,
                                    description: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                rows={4}
                                placeholder="Short bundle description."
                              />
                            </label>
                          </div>
                        </div>

                        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white shrink-0">
                              2
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Upload bundle files
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Add the required documents for this bundle.
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {fileUploadLabels.map((label, index) => {
                              const fileInfo = bundleFiles[label];
                              const displayName =
                                fileInfo?.name || "No file chosen";
                              const hasSavedFile = !!fileInfo?.url;
                              const hasNewFile = !!fileInfo?.file;
                              const fieldId = `bundle-file-${index}`;

                              return (
                                <div
                                  key={label}
                                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">
                                        {label}
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        Upload one file for this document.
                                      </p>
                                    </div>
                                    
                                  </div>

                                  <label
                                    htmlFor={fieldId}
                                    className="mt-4 flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50"
                                  >
                                    <UploadCloud className="h-7 w-7 text-emerald-600" />
                                    <span className="my-1">Choose file</span>
                                    <span className=" text-[10px] text-slate-500">
                                      Allowed: PDF, TXT, DOC, DOCX, XLS, XLSX
                                    </span>
                                    <span className="mt-1 text-xs font-semibold text-slate-700">
                                      {displayName}
                                    </span>
                                  </label>

                                  <input
                                    id={fieldId}
                                    type="file"
                                    accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
                                    onChange={(event) => {
                                      const file =
                                        event.target.files?.[0] || null;
                                      setBundleFiles((prev) => ({
                                        ...prev,
                                        [label]: {
                                          file,
                                          name:
                                            file?.name ||
                                            prev[label]?.name ||
                                            "",
                                          type:
                                            file?.type ||
                                            prev[label]?.type ||
                                            "",
                                          size:
                                            file?.size ??
                                            prev[label]?.size ??
                                            0,
                                          url: file
                                            ? undefined
                                            : prev[label]?.url,
                                          path: file
                                            ? undefined
                                            : prev[label]?.path,
                                        },
                                      }));
                                    }}
                                    className="sr-only"
                                  />

                                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                                    
                                    {hasSavedFile && !hasNewFile ? (
                                      <span className="text-emerald-700">
                                        saved
                                      </span>
                                    ) : null}
                                  </div>

                                  {hasSavedFile && !hasNewFile ? (
                                    <p className="mt-2 text-xs text-emerald-700">
                                      Existing file:{" "}
                                      <a
                                        href={fileInfo?.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline hover:text-emerald-900"
                                      >
                                        {fileInfo?.name}
                                      </a>
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          {isUploadingFiles && (
                            <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>Uploading files...</span>
                                <span>{bundleUploadProgress}%</span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                                  style={{ width: `${bundleUploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <p className="mt-4 text-sm text-slate-500">
                            Allowed formats: PDF, TXT, DOC, DOCX, XLS, XLSX.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={saveBundle}
                          disabled={isSavingBundle || isUploadingFiles}
                          className="inline-flex items-center justify-center rounded-md bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                          {isSavingBundle || isUploadingFiles
                            ? "Saving bundle..."
                            : editingBundle
                              ? "Save bundle"
                              : "Create bundle"}
                        </button>
                        {/* <button
                        type="button"
                        onClick={() => setBundleFormOpen(false)}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      >
                        Close
                      </button> */}
                      </div>

                      <div className="rounded-md border border-emerald-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Live bundle preview
                            </p>
                            <p className="text-xs text-slate-500">
                              Preview shows auto-generated state-specific
                              features.
                            </p>
                          </div>
                        </div>
                        <BundleCard
                          bundle={previewBundle}
                          actionLabel="Preview"
                          variant="admin"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 hidden rounded-md border border-slate-200 bg-slate-50 p-6">
                      <p className="text-sm leading-6 text-slate-700">
                        Ready to upload a new bundle? Click New bundle to open
                        the upload form and publish content separately from the
                        bundle list.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeSection === "Upload Individual Bundle" && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl w-full">
                  {individualBundleFormOpen ? (
                    <div className="space-y-6">
                      <div className="rounded-[1rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="md:text-sm text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                              Upload Individual Bundle
                            </p>
                            <h3 className="mt-2 md:text-3xl text-2xl font-bold tracking-tight text-slate-950">
                              Add state-specific resources
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                              Upload individual care business documents for a
                              specific state.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6">
                        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white shrink-0">
                              1
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Select State
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Choose the state for this individual bundle.
                              </p>
                            </div>
                          </div>
                          <div className="mt-5">
                            <label className="block text-sm font-semibold text-slate-700">
                              State
                              <select
                                value={individualBundleForm.state}
                                onChange={(event) =>
                                  setIndividualBundleForm({
                                    ...individualBundleForm,
                                    state: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              >
                                <option value="">Select a state...</option>
                                {states.map((state) => (
                                  <option key={state.code} value={state.name}>
                                    {state.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white shrink-0">
                              2
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Upload Files
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Add the required documents for this individual
                                bundle.
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {individualFileUploadLabels.map((label, index) => {
                              const fileInfo = individualBundleFiles[label];
                              const displayName =
                                fileInfo?.name || "No file chosen";
                              const hasSavedFile = !!fileInfo?.url;
                              const hasNewFile = !!fileInfo?.file;
                              const fieldId = `individual-file-${index}`;

                              return (
                                <div
                                  key={label}
                                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">
                                        {label}
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        Upload the required file for this item.
                                      </p>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {displayName}
                                    </span>
                                  </div>

                                  <label
                                    htmlFor={fieldId}
                                    className="mt-4 flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50"
                                  >
                                    <UploadCloud className="h-8 w-8 text-emerald-600" />
                                    <span className="mt-3">Choose file or drag and drop here</span>
                                    <span className="mt-2 text-xs text-slate-500">
                                      Allowed: PDF, TXT, DOC, DOCX, XLS, XLSX
                                    </span>
                                    <span className="mt-3 text-xs font-semibold text-slate-700">
                                      {displayName}
                                    </span>
                                  </label>

                                  <input
                                    id={fieldId}
                                    type="file"
                                    accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
                                    onChange={(event) => {
                                      const file =
                                        event.target.files?.[0] || null;
                                      setIndividualBundleFiles((prev) => ({
                                        ...prev,
                                        [label]: {
                                          file,
                                          name:
                                            file?.name ||
                                            prev[label]?.name ||
                                            "",
                                          type:
                                            file?.type ||
                                            prev[label]?.type ||
                                            "",
                                          size:
                                            file?.size ??
                                            prev[label]?.size ??
                                            0,
                                          url: file
                                            ? undefined
                                            : prev[label]?.url,
                                          path: file
                                            ? undefined
                                            : prev[label]?.path,
                                        },
                                      }));
                                    }}
                                    className="sr-only"
                                  />

                                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                                    <span>{displayName}</span>
                                    {hasSavedFile && !hasNewFile ? (
                                      <span className="text-emerald-700">
                                        saved
                                      </span>
                                    ) : null}
                                  </div>

                                  {hasSavedFile ? (
                                    <p className="mt-2 text-xs text-emerald-700">
                                      Existing file:{" "}
                                      <a
                                        href={fileInfo?.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline hover:text-emerald-900"
                                      >
                                        {fileInfo?.name}
                                      </a>
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          {isUploadingIndividualFiles && (
                            <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>Uploading files...</span>
                                <span>{individualUploadProgress}%</span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                                  style={{ width: `${individualUploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <p className="mt-4 text-sm text-slate-500">
                            Allowed formats: PDF, TXT, DOC, DOCX, XLS, XLSX.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={saveIndividualBundle}
                          disabled={
                            isSavingIndividualBundle ||
                            isUploadingIndividualFiles ||
                            !individualBundleForm.state
                          }
                          className="inline-flex items-center justify-center rounded-md bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                          {isSavingIndividualBundle ||
                          isUploadingIndividualFiles
                            ? "Creating bundle..."
                            : "Create bundle"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[1rem] border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-slate-50 p-8 shadow-sm">
                      <div className="max-w-2xl mx-auto text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
                          <Sparkles className="h-7 w-7 text-emerald-700" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-950 mt-4">
                          Add Individual State Bundles
                        </h3>
                        <p className="mt-3 text-base leading-7 text-slate-600">
                          Upload state-specific care business resources
                          including market research reports, financial
                          templates, policies, and licensing checklists.
                        </p>
                        <div className="mt-8">
                          <button
                            type="button"
                            onClick={openNewIndividualBundleForm}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-800"
                          >
                            <Sparkles className="h-4 w-4" />
                            Upload Individual Bundle
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeSection === "Users" && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl w-full">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Users
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        User access
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={refreshUsers}
                        className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <RefreshCcw className="h-4 w-4 inline" /> Refresh list
                      </button>
                      {/* <button
                      type="button"
                      onClick={() => setActiveSection("Users")}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Review access
                    </button> */}
                    </div>
                  </div>
                  <p className="mt-4 text-slate-600">
                    Review recent signups, manage permissions, and approve user
                    access to course materials.
                  </p>

                  <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4">
                    {loadingUsers ? (
                      <div className="rounded-md bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
                        Loading users...
                      </div>
                    ) : users.length === 0 ? (
                      <div className="rounded-md bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
                        No users found yet. New signups will appear here.
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                            <th className="py-3 pr-4">Name</th>
                            <th className="py-3 pr-4">Email</th>
                            <th className="py-3 pr-4">Role</th>
                            <th className="py-3 pr-4">Joined</th>
                            <th className="py-3 pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {users.map((userProfile) => {
                            const fullName =
                              [userProfile.first_name, userProfile.last_name]
                                .filter(Boolean)
                                .join(" ") || "—";
                            const joinedAt = userProfile.created_at
                              ? new Date(
                                  userProfile.created_at,
                                ).toLocaleDateString()
                              : "—";

                            return (
                              <tr
                                key={userProfile.id}
                                className="hover:bg-slate-50"
                              >
                                <td className="py-4 pr-4 pl-4 font-semibold text-slate-900">
                                  {fullName}
                                </td>
                                <td className="py-4 pr-4 text-slate-600">
                                  {userProfile.email}
                                </td>
                                <td className="py-4 pr-4 text-slate-600">
                                  {userProfile.is_admin
                                    ? "Administrator"
                                    : "Customer"}
                                </td>
                                <td className="py-4 pr-4 text-slate-600">
                                  {joinedAt}
                                </td>
                                <td className="py-4 pr-4">
                                  {userProfile.is_active === false ? (
                                    <button
                                      onClick={() => handleToggleAccess(userProfile.id, false)}
                                      className="cursor-pointer transition-transform duration-200 hover:scale-110 inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700 hover:bg-red-100"
                                    >
                                      Disabled
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleAccess(userProfile.id, true)}
                                      className="cursor-pointer transition-transform duration-200 hover:scale-110 inline-flex items-center gap-2 rounded-md bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 hover:bg-emerald-200"
                                    >
                                      Activated
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
              {activeSection === "Profile Settings" && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Profile Settings
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        Admin profile
                      </h2>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-medium text-slate-500">
                        Admin user
                      </p>
                      <p className="mt-2 text-slate-950 font-semibold">
                        {user?.email}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-medium text-slate-500">Role</p>
                      <p className="mt-2 text-slate-950 font-semibold">
                        Administrator
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Profile details
                      </p>
                      <div className="mt-6 grid gap-4">
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">
                            First name
                          </span>
                          <input
                            type="text"
                            value={profileForm.first_name}
                            onChange={(event) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                first_name: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            placeholder="Enter first name"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">
                            Last name
                          </span>
                          <input
                            type="text"
                            value={profileForm.last_name}
                            onChange={(event) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                last_name: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            placeholder="Enter last name"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={saveProfile}
                          disabled={savingProfile}
                          className="mt-1 inline-flex items-center justify-center rounded-md bg-[#2F5D46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#254A38] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingProfile ? "Saving..." : "Save profile"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Admin summary
                      </p>
                      <div className="mt-6 space-y-4">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                          <p className="text-sm font-medium text-slate-500">
                            Admin user
                          </p>
                          <p className="mt-2 text-slate-950 font-semibold">
                            {user?.email}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                          <p className="text-sm font-medium text-slate-500">
                            Role
                          </p>
                          <p className="mt-2 text-slate-950 font-semibold">
                            Administrator
                          </p>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                          Update your name (if needed) as it appears across
                          admin sections and reports.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
