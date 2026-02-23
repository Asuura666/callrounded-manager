import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/skeleton";
import { Headset, Sparkles, Eye, EyeOff } from "lucide-react";

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-20 left-20 opacity-20 hidden lg:block" style={{ animation: "float 3s ease-in-out infinite" }}>
        <Headset className="w-12 h-12 text-gold" />
      </div>
      <div className="absolute bottom-32 right-24 opacity-20 hidden lg:block" style={{ animation: "float 3s ease-in-out infinite", animationDelay: "1.5s" }}>
        <Sparkles className="w-8 h-8 text-gold" />
      </div>

      <Card className="w-full max-w-md bg-white border-0 shadow-2xl relative z-10" style={{ animation: "scale-in 0.3s ease-out forwards" }}>
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto" style={{ animation: "fade-in 0.4s ease-out forwards" }}>
            <div className="relative inline-block">
              <h1 className="text-5xl font-bold text-gold tracking-wide font-heading">W&I</h1>
              <div className="absolute -top-1 -right-3">
                <Sparkles className="w-4 h-4 text-gold/60" />
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full" />
            </div>
          </div>
          <div style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: "200ms", opacity: 0, animationFillMode: "forwards" }}>
            <CardTitle className="text-xl text-navy font-heading">Bienvenue</CardTitle>
            <CardDescription className="text-text-secondary mt-1">Accédez au portail de gestion de votre salon</CardDescription>
          </div>
        </CardHeader>
        <CardContent style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: "300ms", opacity: 0, animationFillMode: "forwards" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-navy font-medium">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="salon@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#F7F8FA] border-[#D8DCE4] text-navy placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-gold/30 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-navy font-medium">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#F7F8FA] border-[#D8DCE4] text-navy placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-gold/30 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full btn-gold h-11 text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="border-navy/30 border-t-navy" />
                  Connexion...
                </span>
              ) : "Se connecter"}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-[#E4E7ED] text-center">
            <p className="text-xs text-text-muted">Réceptionniste IA pour salons de coiffure</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
