import { LoginForm } from "@/components/LoginForm";
import { PlannerApp } from "@/components/PlannerApp";
import { getActiveSeasonPayload } from "@/lib/season";
import { getCurrentMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const currentMember = await getCurrentMember();

  if (!currentMember) {
    return (
      <main className="login-shell">
        <LoginForm />
      </main>
    );
  }

  const payload = await getActiveSeasonPayload();

  return <PlannerApp currentMember={currentMember} initialPayload={payload} />;
}
