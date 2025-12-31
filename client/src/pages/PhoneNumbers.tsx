import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface PhoneNumber {
  id: string;
  number: string;
  status: "active" | "inactive";
  agentId?: string;
  externalPhoneNumberId: string;
  createdAt: string;
  updatedAt: string;
}

export default function PhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/phone-numbers");
      if (!response.ok) throw new Error("Erreur lors du chargement des numéros");
      const data = await response.json();
      setPhoneNumbers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const togglePhoneNumberStatus = async (phoneNumberId: string, currentStatus: string) => {
    try {
      setTogglingId(phoneNumberId);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      
      setPhoneNumbers(phoneNumbers.map(p => 
        p.id === phoneNumberId ? { ...p, status: newStatus as any } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { className: "bg-green-100 text-green-800", label: "Actif" },
      inactive: { className: "bg-gray-100 text-gray-800", label: "Inactif" },
    };
    const variant = variants[status] || variants.inactive;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des numéros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Numéros de Téléphone</h1>
            </div>
            <Link href="/">
              <Button variant="outline">Retour</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {phoneNumbers.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-12 pb-12 text-center">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun numéro de téléphone disponible</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Numéro</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Agent Associé</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Créé le</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {phoneNumbers.map((phoneNumber) => (
                  <tr key={phoneNumber.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{phoneNumber.number}</span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(phoneNumber.status)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {phoneNumber.agentId ? phoneNumber.agentId.slice(0, 8) + "..." : "Non assigné"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(phoneNumber.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant={phoneNumber.status === "active" ? "destructive" : "default"}
                        size="sm"
                        onClick={() => togglePhoneNumberStatus(phoneNumber.id, phoneNumber.status)}
                        disabled={togglingId === phoneNumber.id}
                      >
                        {togglingId === phoneNumber.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          phoneNumber.status === "active" ? "Désactiver" : "Activer"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
