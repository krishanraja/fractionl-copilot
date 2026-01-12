import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBanner } from '@/components/feedback';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface AuthPageProps {
  onAuthenticated: () => void;
}

export const AuthPage = ({ onAuthenticated }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        setError({ title: 'Sign up failed', message: error.message });
      } else {
        setSuccessMessage('Check your email to confirm your account');
      }
    } catch (error) {
      setError({ title: 'Sign up failed', message: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError({ title: 'Sign in failed', message: error.message });
      } else {
        onAuthenticated();
      }
    } catch (error) {
      setError({ title: 'Sign in failed', message: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const FormContent = () => (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo for mobile */}
      {isMobile && (
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/30f9efde-5245-4c24-b26e-1e368f4a5a1b.png" 
            alt="Fractionl.ai" 
            className="h-8 mx-auto mb-4"
          />
          <p className="text-foreground-muted text-sm">Portfolio Intelligence</p>
        </div>
      )}

      {/* Success message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm text-center"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <div className="mb-6">
        <ErrorBanner
          show={!!error}
          title={error?.title || ''}
          message={error?.message}
          onDismiss={() => setError(null)}
        />
      </div>

      <Tabs defaultValue="signin" className="w-full" onValueChange={clearMessages}>
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="signin" className="text-base h-10">Sign In</TabsTrigger>
          <TabsTrigger value="signup" className="text-base h-10">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold btn-touch" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold btn-touch" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Mobile: Full-screen form
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <FormContent />
        </div>
      </div>
    );
  }

  // Desktop: Split-screen layout
  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand Hero */}
      <div 
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--gradient-hero)' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        {/* Logo */}
        <div className="relative z-10">
          <img 
            src="/lovable-uploads/30f9efde-5245-4c24-b26e-1e368f4a5a1b.png" 
            alt="Fractionl.ai" 
            className="h-10 brightness-0 invert"
          />
        </div>
        
        {/* Main content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-display text-white leading-tight">
            Strategic Intelligence<br />
            for Portfolio Leaders
          </h1>
          <p className="text-lg text-white/80 max-w-md leading-relaxed">
            Track multiple ventures, manage your pipeline, and grow your customer base with clarity and precision.
          </p>
        </div>
        
        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            Trusted by portfolio entrepreneurs worldwide
          </p>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Desktop logo (hidden on lg+) */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/lovable-uploads/30f9efde-5245-4c24-b26e-1e368f4a5a1b.png" 
              alt="Fractionl.ai" 
              className="h-8 mx-auto mb-4"
            />
          </div>
          
          {/* Welcome text for desktop */}
          <div className="hidden lg:block text-center mb-10">
            <h2 className="text-2xl font-heading text-foreground mb-2">Welcome back</h2>
            <p className="text-foreground-secondary">Sign in to continue to your dashboard</p>
          </div>
          
          <FormContent />
        </div>
      </div>
    </div>
  );
};
