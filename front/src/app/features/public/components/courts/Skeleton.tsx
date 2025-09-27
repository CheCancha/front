export const PageSkeleton = () => (
  <div className="container mx-auto px-6 py-12 animate-pulse">
    <div className="max-w-7xl mx-auto">
      <div className="relative mb-8 h-64 md:h-96 rounded-2xl bg-gray-200"></div>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-gray-200 rounded-2xl h-96"></div>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-200 rounded-2xl h-24"></div>
          <div className="bg-gray-200 rounded-2xl h-40"></div>
        </div>
      </div>
    </div>
  </div>
);
