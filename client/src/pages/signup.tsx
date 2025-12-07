import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setLocation("/home");
      } else {
        login();
      }
    }
  }, [isAuthenticated, isLoading, setLocation, login]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
