import LowStockSettings from '@/components/settings/LowStockSettings';

export const dynamic = 'force-dynamic';

export default function LowStockSettingsPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Stock Rules</h1>
      <LowStockSettings />
    </main>
  );
}
