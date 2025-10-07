import MainRouter from "./router/MainRouter";
// import { QueryClient, QueryClientProvider } from "react-query";
// import { TooltipProvider } from "some-tooltip-library";
import { Toaster } from "sonner";

// const queryClient = new QueryClient();

function App() {
  return (
    <>
      {/* Uncomment these if you want to use react-query and tooltips */}
      {/* 
      <QueryClientProvider client={queryClient}>
        <TooltipProvider> 
      */}
          <Toaster position="top-right" richColors />
          <MainRouter />
      {/* 
        </TooltipProvider>
      </QueryClientProvider> 
      */}
    </>
  );
}

export default App;
