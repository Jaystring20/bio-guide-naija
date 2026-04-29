import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ProfileSwitcher } from "./ProfileSwitcher";

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <ProfileSwitcher />
      <Outlet />
      <BottomNav />
    </div>
  );
};
