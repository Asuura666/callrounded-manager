import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Agents from "./pages/Agents";
import Calls from "./pages/Calls";
import CallDetail from "./pages/CallDetail";
import PhoneNumbers from "./pages/PhoneNumbers";
import KnowledgeBases from "./pages/KnowledgeBases";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agents" component={Agents} />
      <Route path="/calls" component={Calls} />
      <Route path="/calls/:id" component={CallDetail} />
      <Route path="/phone-numbers" component={PhoneNumbers} />
      <Route path="/knowledge-bases" component={KnowledgeBases} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
