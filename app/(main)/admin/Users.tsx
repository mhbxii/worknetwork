import { SkeletonScreen } from "@/components/ui/skeletonScreen";

export default function Users() {
  return (
    <SkeletonScreen
      title="User Management"
      icon="account-group"
      description="Manage users, ban/unban, and moderate content"
    />
  );
}
