import { DEFAULT_INDIVIDUAL_ITEM_PRICE, INDIVIDUAL_ITEM_PRICES } from "@/lib/pricing";
import Stepper from "./Stepper";
import { useToast } from "./SimpleToast";
import { programTypeIcons } from "./lucide-icons";
import { FileText, Award, Users, Loader } from "lucide-react";
import BundleModal from "./BundleModal";
import BundlePreviews from "./BundlePreviews";
import { assetPreview, bundleSlugFor } from "@/lib/previews";
import CompareModal from "./CompareModal";
import DetailsModal from "./DetailsModal";
import React from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import GetStartedSidebar from "./GetStartedSidebar";
import { useCart } from "./cart-context";
import useBuyNow from "./useBuyNow";
import GetStartedStickyBar from "./GetStartedStickyBar";

export default function GetStartedComponentThree({
  steps,
  currentStep,
  selectedState,
  selectedType,
  stateNames,
  programTypes,
  bundleProducts,
  bonusProducts,
  individualProducts,
  bundleModalOpen,
  setBundleModalOpen,
}: {
  steps: string[];
  currentStep: number;
  selectedState: string;
  selectedType: string;
  stateNames: { [abbr: string]: string };
  programTypes: { key: string; desc: string }[];
  bundleProducts: { key: string }[];
  bonusProducts: { key: string }[];
  individualProducts: { key: string; desc: string; popular?: boolean }[];
  bundleModalOpen: boolean;
  setBundleModalOpen: (open: boolean) => void;
}) {
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [detailsProduct, setDetailsProduct] = React.useState<any | null>(null);
  const [compareModalOpen, setCompareModalOpen] = React.useState(false);
  const [selectedBundle, setSelectedBundle] = React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [individualBundles, setIndividualBundles] = React.useState<any[]>([]);
  const [loadingBundles, setLoadingBundles] = React.useState(true);
  const [completeBundle, setCompleteBundle] = React.useState<any | null>(null);
  const { items: cartItems, addItem, removeItem } = useCart();
  const { buyNow, loading: buyLoading } = useBuyNow();
  const toast = useToast();
  const router = useRouter();

  const individualItemPricing = INDIVIDUAL_ITEM_PRICES;

  const individualItemDescriptions: Record<string, string> = {
    "Market Research Report": "Comprehensive market analysis, competitor landscape, demographic data, demand forecasting, and revenue projections.",
    "Pro Forma P&L Template": "12-month financial projections, startup costs, break-even analysis, and cash flow modeling.",
    "Policy & Procedure Manual": "State-specific, audit-ready P&P manual covering all regulatory requirements.",
    "Licensing Checklist": "Step-by-step checklist covering every requirement for state approval.",
  };

  // Individual product slugs for database resolution
  const individualProductSlugs: Record<string, string> = {
    "Market Research Report": "market-research-report",
    "Policy & Procedure Manual": "policy-procedure-manual",
    "Pro Forma P&L Template": "pro-forma-pl-template",
    "Licensing Checklist": "licensing-checklist",
  };

  const stateResources = React.useMemo(() => {
    return individualBundles.flatMap((bundle) => {
      // Only show files from complete bundles for this program type
      if (bundle.metadata?.productLabel !== 'Complete Bundle') return [];
      
      // Filter to only show files from the bundle matching the selected program type
      if (bundle.metadata?.program !== selectedType) return [];
      
      const files = Array.isArray(bundle.metadata?.files) ? bundle.metadata.files : [];
      return files.map((file: any) => ({
        ...file,
        bundleId: bundle.id,
        bundleName: bundle.name,
        bundleDescription: bundle.description,
        bundleState: bundle.metadata?.state || bundle.state,
        bundleStateAbbr: selectedState,
        bundleStateName: stateNames[selectedState],
        bundleProgram: bundle.metadata?.program,
      }));
    });
  }, [individualBundles, selectedType, stateNames]);

  // Fetch all bundles (complete and individual) for the selected state
  React.useEffect(() => {
    const fetchBundles = async () => {
      setLoadingBundles(true);
      try {
        const stateName = stateNames[selectedState];
        // Fetch ALL products for this state (including individual bundles)
        const response = await fetch(`/api/products?includeIndividual=true&state=${encodeURIComponent(stateName)}&program=${encodeURIComponent(selectedType)}`);
        const data = await response.json();
        
        if (response.ok) {
          const allProducts = data.products || [];
          
          // Separate complete bundles from individual bundles
          const completeBundles = allProducts.filter(
            (p: any) => p.metadata?.productLabel === 'Complete Bundle'
          );
          
          // Set all bundles (both types) for display
          setIndividualBundles(allProducts);
          
          // Find the complete bundle matching this state AND program type
          const matchingBundle = completeBundles.find(
            (b: any) => b.metadata?.program === selectedType
          );
          
          setCompleteBundle(matchingBundle || null);
        } else {
          console.error('Failed to fetch bundles:', data.error);
          setIndividualBundles([]);
          setCompleteBundle(null);
        }
      } catch (error) {
        console.error('Error fetching bundles:', error);
        setIndividualBundles([]);
        setCompleteBundle(null);
      } finally {
        setLoadingBundles(false);
      }
    };

    if (selectedState) {
      fetchBundles();
    }
  }, [selectedState, selectedType, stateNames]);
  return (
    <>
      <Stepper currentStep={currentStep} steps={steps} />
      <section className="flex flex-col items-center justify-center py-4 md:py-8 pb-24 md:pb-32 px-4">
        {/* Header Badges */}
        <div className="w-full max-w-6xl flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-2">
          <span className="bg-[#eaffea] text-[#417a5a] font-semibold px-3 py-1.5 rounded-full text-sm mr-0 sm:mr-2">State:</span>
          <span className="bg-[#417a5a] text-white font-semibold px-3 py-1.5 rounded-full text-sm mr-0 sm:mr-2">{stateNames[selectedState]}</span>
          <span className="bg-[#eaffea] text-[#417a5a] font-semibold px-3 py-1.5 rounded-full text-sm mr-0 sm:mr-2">Program:</span>
          <span className="bg-[#417a5a] text-white font-semibold px-3 py-1.5 rounded-full text-sm">{selectedType}</span>
        </div>
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar */}
          <GetStartedSidebar
            stateNames={stateNames}
            selectedState={selectedState}
            selectedType={selectedType}
            programTypes={programTypes}
            onStateChange={abbr => router.push(`/get-started?state=${abbr}&type=${encodeURIComponent(selectedType)}`)}
            onTypeChange={type => router.push(`/get-started?state=${selectedState}&type=${encodeURIComponent(type)}`)}
          />
          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col items-center mb-4 md:mb-6">
              <span className="bg-[#eaffea] text-[#417a5a] font-semibold px-3 py-1.5 rounded-full mb-2 text-sm">{stateNames[selectedState]} • {selectedType}</span>
              <h2 className="text-xl md:text-2xl font-bold text-[#417a5a] mb-2 text-center">Choose Your Products</h2>
              <p className="text-[#417a5a] mb-4 md:mb-6 text-center text-sm md:text-base">Select the resources you need to launch your {selectedType} in {stateNames[selectedState]}</p>
            </div>
            {/* Bundle Card */}
            <div className="border border-[#eaffea] rounded-xl bg-[#f9f9f4] p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 items-center mb-6 md:mb-8 shadow-sm">
              <div className="flex-1 w-full">
                {/* <span className="bg-[#e6d7b0] text-[#7a5a41] text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full">★ Most Popular - Save ${completeBundle?.metadata?.oldPrice && completeBundle?.price ? (completeBundle.metadata.oldPrice - completeBundle.price).toFixed(0) : 'Loading...'}</span> */}
                <span className="bg-[#e6d7b0] text-[#7a5a41] text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full">★ Most Popular</span>
                <h3 className="text-lg md:text-xl font-bold text-[#417a5a] mt-3 mb-2 flex items-center gap-2">
                  {loadingBundles ? (
                    <>
                      <Loader size={24} className="text-green-700 animate-spin" />
                      <span className="text-gray-600 text-base">Loading bundle...</span>
                    </>
                  ) : (
                    `${stateNames[selectedState]} ${selectedType} Bundle`
                  )}
                </h3>
                <p className="text-[#417a5a] mb-3 md:mb-4 text-sm md:text-base">Everything you need to launch your care business with confidence</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-1 mb-3 md:mb-4">
                  {bundleProducts.map((p) => (
                    <li key={p.key} className="flex items-center gap-2 text-[#417a5a] text-xs md:text-sm">✔ {p.key}</li>
                  ))}
                </ul>
                <div className="text-xs font-semibold text-[#417a5a] mb-1">BONUSES INCLUDED:</div>
                <ul className="mb-2">
                  {bonusProducts.map((p) => (
                    <li key={p.key} className="flex items-center gap-2 text-[#417a5a] text-xs">✔ {p.key}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-0 w-full lg:min-w-55 lg:w-auto">
                {completeBundle?.price && completeBundle?.metadata?.complete !== false ? (
                  <div className="text-3xl font-bold text-[#417a5a]">${Number(completeBundle.price).toFixed(0)}</div>
                ) : null}
                <p className="text-[#417a5a] text-xs md:text-sm text-center">Everything you need in one complete package</p>
                {completeBundle?.metadata?.complete === false ? (
                  <p className="mt-1 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
                    The full bundle for this program is being finalized. The resources below are available now.
                  </p>
                ) : null}
                {completeBundle?.product_slug && completeBundle?.price && completeBundle?.metadata?.complete !== false ? (
                  <button
                    className="mt-1 bg-[#417a5a] hover:bg-[#356549] text-white font-semibold px-4 py-3 rounded-xl shadow-sm w-full text-sm md:text-base transition-colors disabled:opacity-60"
                    disabled={buyLoading}
                    onClick={() =>
                      buyNow({
                        id: completeBundle.product_slug,
                        name: `${stateNames[selectedState]} ${selectedType} Bundle`,
                        price: Number(completeBundle.price),
                        type: selectedType,
                        state: selectedState,
                        quantity: 1,
                        product_id: completeBundle.id,
                        product_slug: completeBundle.product_slug,
                      })
                    }
                  >
                    {buyLoading ? "Processing…" : `Buy the Bundle - $${Number(completeBundle.price).toFixed(0)}`}
                  </button>
                ) : null}
                {completeBundle?.metadata?.complete !== false ? (
                <button
                  className="mt-2 bg-white border border-[#e6d7b0] cursor-pointer transition-colors duration-300 hover:bg-[#e6d7b0] text-[#7a5a41] font-semibold px-4 py-2 md:px-6 md:py-2 rounded-xl shadow-sm w-full text-sm md:text-base"
                  onClick={() => setBundleModalOpen(true)}
                >
                  See What's Included
                </button>
                ) : null}
              </div>
            </div>
            {/* Real sample pages from this bundle */}
            {!loadingBundles && completeBundle?.metadata?.complete !== false ? (
              <div className="mb-8 rounded-xl border border-[#eaffea] bg-white p-4 shadow-sm md:p-6">
                <BundlePreviews
                  productSlug={completeBundle?.product_slug}
                  stateName={stateNames[selectedState]}
                  program={selectedType}
                />
              </div>
            ) : null}
            {/* Individual Bundles */}
            <div className="w-full mb-6">
              <h3 className="text-lg md:text-xl font-bold text-[#417a5a] mb-4">Individual State Resources</h3>
              {loadingBundles ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader size={32} className="text-green-700 animate-spin" />
                  <p className="text-center text-[#417a5a] text-sm">Loading individual bundles...</p>
                </div>
              ) : stateResources.length === 0 ? (
                <p className="text-center text-[#417a5a] py-8">No individual bundles available for {stateNames[selectedState]}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
                  {stateResources.map((resource, index) => {
                    const uniqueFileId = resource.name || resource.path || resource.url || index;
                    const itemId = `${resource.bundleId}-${resource.label}-${uniqueFileId}`;
                    const itemPrice = individualItemPricing[resource.label] ?? DEFAULT_INDIVIDUAL_ITEM_PRICE;
                    const itemDesc = individualItemDescriptions[resource.label] ?? resource.label;
                    const isSelected = selectedProducts.includes(itemId);

                    const handleSelect = async () => {
                      // Direct purchase for this individual resource
                      // Find the full bundle to get complete metadata
                      const fullBundle = individualBundles.find(b => b.id === resource.bundleId);
                      
                      // Create metadata with ONLY the purchased item, not all files
                      const individualMetadata = {
                        ...fullBundle?.metadata,
                        files: [
                          {
                            label: resource.label,
                            name: resource.name,
                            type: resource.type,
                            size: resource.size,
                            path: resource.path,
                            url: resource.url,
                          }
                        ],
                      };
                      
                      await buyNow({
                        id: itemId,
                        name: resource.label,
                        price: itemPrice,
                        type: selectedType,
                        state: selectedState,
                        quantity: 1,
                        // Link to the bundle product
                        product_id: resource.bundleId,
                        product_slug: fullBundle?.product_slug,
                        // Store which specific item is being purchased
                        purchased_item: resource.label,
                        purchased_item_price: itemPrice,
                        metadata: individualMetadata,
                        bundle_id: resource.bundleId,
                      });
                    };

                    return (
                      <div key={itemId} className={`bg-white border ${isSelected ? 'border-[#417a5a] ring-2 ring-[#417a5a]' : 'border-[#eaffea]'} rounded-xl p-4 md:p-6 shadow-sm`}>
                        {(() => {
                          const thumb = assetPreview(completeBundle?.product_slug || bundleSlugFor(stateNames[selectedState] || "", selectedType), resource.label);
                          return thumb ? (
                            <a href={thumb.src} target="_blank" rel="noopener noreferrer" className="-mx-4 -mt-4 mb-4 block overflow-hidden rounded-t-xl border-b border-[#eaffea] bg-slate-50 md:-mx-6 md:-mt-6">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb.src} alt={`${resource.label} sample page`} loading="lazy" className="h-40 w-full object-cover object-top transition duration-300 hover:scale-[1.02]" />
                            </a>
                          ) : null;
                        })()}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="capitalize font-semibold text-[#417a5a] text-sm md:text-base">{resource.label}</span>
                        </div>
                        <div className="text-[#417a5a] text-xs mb-3 md:mb-4">{itemDesc}</div>
                        <div className="text-[#417a5a] font-semibold text-sm mb-3">${itemPrice}</div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            className={`border border-[#417a5a] text-[#417a5a] font-semibold px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm hover:bg-[#eaffea] transition-all ${isSelected ? 'bg-[#eaffea]' : 'bg-white'}`}
                            onClick={handleSelect}
                          >{isSelected ? 'Selected' : 'Select'}</button>
                          <button
                            className="border border-[#417a5a] text-[#417a5a] font-semibold px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm hover:bg-[#eaffea] transition-all"
                            onClick={() => {
                              setDetailsProduct({
                                ...resource,
                                label: resource.label,
                                description: itemDesc,
                                price: itemPrice,
                              });
                              setDetailsModalOpen(true);
                            }}
                          >View Details</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </section>
      <BundleModal
        open={bundleModalOpen}
        onClose={() => setBundleModalOpen(false)}
        state={stateNames[selectedState]}
        stateAbbr={selectedState}
        program={selectedType}
        bundleTitle={`${stateNames[selectedState]} ${selectedType} Bundle`}
        productSlug={completeBundle?.product_slug}
        price={completeBundle?.price}
        oldPrice={completeBundle?.metadata?.oldPrice}
        saveAmount={completeBundle?.metadata?.oldPrice && completeBundle?.price ? completeBundle.metadata.oldPrice - completeBundle.price : 0}
        items={
          completeBundle?.features && completeBundle.features.length > 0
            ? completeBundle.features.map((label: string) => ({ label, price: 0 }))
            : bundleProducts.map((p) => ({ label: p.key, price: 0 }))
        }
        bonuses={
          completeBundle?.metadata?.bonuses && completeBundle.metadata.bonuses.length > 0
            ? completeBundle.metadata.bonuses
            : bonusProducts.map((p) => p.key)
        }
        coursePrice={completeBundle?.metadata?.coursePrice}
      />
      <GetStartedStickyBar
        onBack={() => router.push(`/get-started?state=${selectedState}`)}
        onContinue={() => {
          // Allow checkout if bundle is selected OR bundle is in cart OR any individual bundle is in cart
          const bundleInCart = cartItems.some(
            item => item.product_slug === completeBundle?.product_slug || item.name === `${stateNames[selectedState]} ${selectedType} Bundle`
          );
          const individualBundleInCart = cartItems.some(item => selectedProducts.includes(item.id));
          if (selectedBundle || bundleInCart || individualBundleInCart) {
            const params = new URLSearchParams({
              state: selectedState,
              type: selectedType,
              step: 'checkout',
              bundle: selectedBundle || bundleInCart ? '1' : '',
              products: individualBundleInCart ? cartItems.filter(item => selectedProducts.includes(item.id)).map(item => item.id).join(',') : ''
            });
            router.push(`/get-started?${params.toString()}`);
          } else {
            Swal.fire({
              icon: "warning",
              title: "Select a product",
              text: "Please select at least one product or the bundle to continue.",
              confirmButtonColor: "#417a5a"
            });
          }
        }}
      />
    {/* Details Modal integration */}
    {detailsModalOpen && detailsProduct && (
      <DetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onRequestCompare={() => {
          setDetailsModalOpen(false);
          setCompareModalOpen(true);
        }}
        state={stateNames[selectedState]}
        agencyType={selectedType}
        price={detailsProduct.price}
        oldPrice={detailsProduct.oldPrice}
        features={detailsProduct.features || [detailsProduct.description || detailsProduct.desc]}
        productKey={detailsProduct.key || detailsProduct.label}
        productDesc={detailsProduct.description || detailsProduct.desc}
        productTitle={detailsProduct.label || detailsProduct.key || detailsProduct.title || ''}
      />
    )}
    {/* Compare Modal for upgrade flow */}
    {compareModalOpen && detailsProduct && (
      <CompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        currentProduct={detailsProduct}
        state={stateNames[selectedState]}
        stateAbbr={selectedState}
        bundleTitle={`${stateNames[selectedState]} ${selectedType} Bundle`}
      />
    )}
    </>
  );
}
