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
import MyProjects from "@/pages/my-projects";
import Favorites from "@/pages/favorites";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import HelpSupport from "@/pages/help-support";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/discover" component={Discover} />
      <Route path="/image-gen" component={ImageGenerator} />
      <Route path="/bg-remover" component={BackgroundRemover} />
      <Route path="/mockup" component={MockupGenerator} />
      <Route path="/projects" component={MyProjects} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/billing" component={Billing} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={HelpSupport} />
      
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
