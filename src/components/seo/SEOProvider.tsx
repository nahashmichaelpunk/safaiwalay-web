import { HelmetProvider } from 'react-helmet-async';

interface SEOProviderProps {
  children: React.ReactNode;
}

export default function SEOProvider({ children }: SEOProviderProps) {
  return (
    <HelmetProvider>
      {children}
    </HelmetProvider>
  );
}
