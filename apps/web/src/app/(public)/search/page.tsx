export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Search Properties</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">Filters</h2>
          <p className="text-sm text-gray-500">Search filters coming soon</p>
        </aside>
        <div className="lg:col-span-3">
          <p className="text-gray-500">Property listings will appear here</p>
        </div>
      </div>
    </div>
  );
}
