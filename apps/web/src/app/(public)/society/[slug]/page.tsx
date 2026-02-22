export default function SocietyPage({ params }: { params: { slug: string } }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Society: {params.slug}</h1>
      <p className="text-gray-500">Society details and available properties coming soon</p>
    </div>
  );
}
