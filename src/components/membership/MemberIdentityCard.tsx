import { Mail, Phone, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { myAccountQuery } from "@/services/membership.service";

export function MemberIdentityCard() {
  const { data } = useQuery(myAccountQuery());
  if (!data) return null;

  const { profile } = data;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
        <span className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-semibold">{profile.fullName ?? "Member"}</span>
        </span>
        {profile.email && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 text-primary" />
            {profile.email}
          </span>
        )}
        {profile.phone && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 text-primary" />
            {profile.phone}
          </span>
        )}
      </div>
    </section>
  );
}
