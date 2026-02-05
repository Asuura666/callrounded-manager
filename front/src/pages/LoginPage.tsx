import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <Card className="w-full max-w-md bg-white border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* W&I Text Logo */}
          <div className="mx-auto">
            <h1 className="text-5xl font-bold text-gold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              W&I
            </h1>
            <div className="flex justify-center mt-3">
              <div className="w-16 h-0.5 bg-gold/50 rounded-full" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Bienvenue
            </CardTitle>
            <CardDescription className="text-text-secondary mt-1">
              Accédez au portail de gestion de votre salon
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
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
                className="bg-[#F7F8FA] border-[#D8DCE4] text-navy placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-gold/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-navy font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#F7F8FA] border-[#D8DCE4] text-navy placeholder:text-text-muted focus-visible:border-gold focus-visible:ring-gold/30"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold-light text-navy font-semibold shadow-md hover:shadow-lg transition-all"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
