import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { TopBar } from "@/components/layout/TopBar";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAFAF9] dark:bg-[#0C0A09]">
        <SidebarNav />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar profile={profile} />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
