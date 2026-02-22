export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {['Properties', 'Leads', 'Dealers', 'Revenue'].map((stat) => (
          <div key={stat} className="rounded-lg border p-6">
            <h3 className="text-sm font-medium text-gray-500">{stat}</h3>
            <p className="mt-2 text-3xl font-bold">--</p>
          </div>
        ))}
      </div>
    </div>
  );
}
