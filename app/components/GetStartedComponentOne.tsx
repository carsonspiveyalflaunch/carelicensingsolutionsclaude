
import Stepper from "./Stepper";
import GetStartedMap from "./GetStartedMap";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import GetStartedStickyBar from "./GetStartedStickyBar";

export default function GetStartedComponentOne({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  const router = useRouter();
  return (
    <>
      <Stepper currentStep={currentStep} steps={steps} />
      <GetStartedMap />
      <GetStartedStickyBar
        onBack={() => router.push("/")}
        onContinue={() => {
          Swal.fire({
            icon: "warning",
            title: "Select a state",
            text: "Please select a state from the map to continue.",
            confirmButtonColor: "#417a5a"
          });
        }}
        continueDisabled={true}
      />
    </>
  );
}
