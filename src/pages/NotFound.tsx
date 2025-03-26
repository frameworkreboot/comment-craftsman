
import React from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center max-w-md mx-auto bg-white/40 backdrop-blur-sm shadow-soft rounded-xl p-8 border animate-fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-medium text-primary">404</span>
        </div>
        <h1 className="text-3xl font-medium mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
