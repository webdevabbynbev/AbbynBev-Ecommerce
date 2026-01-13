import AccountTabs from "./AccountTabs";

export default function AccountLayout({ children }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 lg:px-10 py-6 pb-28">
      <div className="flex">
        {/* Tabs — desktop only */}
        <aside className="hidden lg:block w-64 shrink-0">
          <AccountTabs />
        </aside>

        {/* Content — always visible */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
