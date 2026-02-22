export default function PropertyPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Property Details</h1>
      <p className="text-gray-500">Property {params.id} details coming soon</p>
    </div>
  );
}
