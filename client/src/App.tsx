import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import ImageGenerator from "@/pages/image-generator";
import BackgroundRemover from "@/pages/background-remover";
import MockupGenerator from "@/pages/mockup-generator";
import MyCreations from "@/pages/my-creations";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import HelpSupport from "@/pages/help-support";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import NewProject from "@/pages/new-project";
import UploadDesign from "@/pages/upload-design";
import BatchProcess from "@/pages/batch-process";
import ImportUrl from "@/pages/import-url";
import RandomPrompt from "@/pages/random-prompt";
import AffiliateProgram from "@/pages/affiliate-program";
import StudioPage from "@/pages/studio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile" component={Profile} />
      <Route path="/discover" component={Discover} />
      <Route path="/image-gen" component={ImageGenerator} />
      <Route path="/bg-remover" component={BackgroundRemover} />
      <Route path="/mockup" component={MockupGenerator} />
      <Route path="/my-creations" component={MyCreations} />
      <Route path="/billing" component={Billing} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={HelpSupport} />
      <Route path="/affiliate" component={AffiliateProgram} />
      
      {/* Quick Action Routes */}
      <Route path="/new-project" component={NewProject} />
      <Route path="/upload-design" component={UploadDesign} />
      <Route path="/batch-process" component={BatchProcess} />
      <Route path="/import-url" component={ImportUrl} />
      <Route path="/random-prompt" component={RandomPrompt} />
      
      {/* AI Studio Test Page */}
      <Route path="/studio" component={StudioPage} />
      
      {/* Mock routes for sidebar navigation to just show home for now, or 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
