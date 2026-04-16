import { Spinner } from "@zalem/ui/components/optics/spinner";

export default function StoreLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
