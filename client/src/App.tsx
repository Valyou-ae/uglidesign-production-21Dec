import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard, AdminGuard } from "@/components/auth-guard";
import { LoginPopupProvider } from "@/components/login-popup";
import PublicHome from "@/pages/public-home";
import Discover from "@/pages/discover";
import ImageGenerator from "@/pages/image-generator";
import BackgroundRemover from "@/pages/background-remover";
import MockupGenerator from "@/pages/mockup-generator";
import MyCreations from "@/pages/my-creations";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import HelpSupport from "@/pages/help-support";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import NewProject from "@/pages/new-project";
import UploadDesign from "@/pages/upload-design";
import BatchProcess from "@/pages/batch-process";
import ImportUrl from "@/pages/import-url";
import RandomPrompt from "@/pages/random-prompt";
import AffiliateProgram from "@/pages/affiliate-program";
import Pricing from "@/pages/pricing";
import Landing from "@/pages/landing";
import MoodBoard from "@/pages/mood-board";
import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminCRM from "@/pages/admin/crm";
import AdminContacts from "@/pages/admin/contacts";
import AdminDeals from "@/pages/admin/deals";
import AdminAnalytics from "@/pages/admin/analytics";

function Router() {
  return (
    <Switch>
      {/* Public home page */}
      <Route path="/" component={PublicHome} />

      {/* Public routes */}
      <Route path="/landing" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/help" component={HelpSupport} />


      {/* Protected routes (require authentication) */}
      <Route path="/discover">
        <AuthGuard>
          <Discover />
        </AuthGuard>
      </Route>
      <Route path="/image-gen">
        <AuthGuard>
          <ImageGenerator />
        </AuthGuard>
      </Route>
      <Route path="/bg-remover">
        <AuthGuard>
          <BackgroundRemover />
        </AuthGuard>
      </Route>
      <Route path="/mockup">
        <AuthGuard>
          <MockupGenerator />
        </AuthGuard>
      </Route>
      <Route path="/my-creations">
        <AuthGuard>
          <MyCreations />
        </AuthGuard>
      </Route>
      <Route path="/billing">
        <AuthGuard>
          <Billing />
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard>
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard>
          <Profile />
        </AuthGuard>
      </Route>
      <Route path="/affiliate">
        <AuthGuard>
          <AffiliateProgram />
        </AuthGuard>
      </Route>
      <Route path="/new-project">
        <AuthGuard>
          <NewProject />
        </AuthGuard>
      </Route>
      <Route path="/upload-design">
        <AuthGuard>
          <UploadDesign />
        </AuthGuard>
      </Route>
      <Route path="/batch-process">
        <AuthGuard>
          <BatchProcess />
        </AuthGuard>
      </Route>
      <Route path="/import-url">
        <AuthGuard>
          <ImportUrl />
        </AuthGuard>
      </Route>
      <Route path="/random-prompt">
        <AuthGuard>
          <RandomPrompt />
        </AuthGuard>
      </Route>
      <Route path="/mood-boards">
        <AuthGuard>
          <MoodBoard />
        </AuthGuard>
      </Route>

      {/* Admin routes (require admin role) */}
      <Route path="/admin">
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path="/admin/users">
        <AdminGuard>
          <AdminUsers />
        </AdminGuard>
      </Route>
      <Route path="/admin/crm">
        <AdminGuard>
          <AdminCRM />
        </AdminGuard>
      </Route>
      <Route path="/admin/crm/contacts">
        <AdminGuard>
          <AdminContacts />
        </AdminGuard>
      </Route>
      <Route path="/admin/crm/deals">
        <AdminGuard>
          <AdminDeals />
        </AdminGuard>
      </Route>
      <Route path="/admin/analytics">
        <AdminGuard>
          <AdminAnalytics />
        </AdminGuard>
      </Route>

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoginPopupProvider>
          <Toaster />
          <Router />
        </LoginPopupProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
