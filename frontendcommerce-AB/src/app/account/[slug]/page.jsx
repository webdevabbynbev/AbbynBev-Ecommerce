import { use } from "react";
import AccountTabs from "../AccountTabs"; // pastikan export-nya benar

export default function page({ params }) {
  const { slug } = use(params); 
  return (
    <div className="flex mx-auto w-full justify-center py-6 px-10">
      <AccountTabs slug={slug} />
    </div>
  );
}
