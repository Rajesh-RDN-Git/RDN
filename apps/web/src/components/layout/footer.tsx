export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} RDN — Residential Dealer Network. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
