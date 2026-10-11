import { obterSessao } from "@/lib/auth";
import MobileNavDrawer from "./MobileNavDrawer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await obterSessao();

  return (
    <MobileNavDrawer sessao={sessao}>
      {children}
    </MobileNavDrawer>
  );
}
