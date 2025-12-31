import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, BarChart3, Settings, Bell, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">CallRounded Manager</h1>
            <p className="text-gray-600 text-lg">Gérez vos agents téléphoniques avec élégance</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <p className="text-gray-700 mb-6">
              Connectez-vous pour accéder à votre tableau de bord et gérer vos agents téléphoniques, appels et conversations.
            </p>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-lg">
                Se connecter
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <Phone className="w-6 h-6 text-blue-600 mb-2" />
                <CardTitle className="text-sm">Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Gérez vos agents téléphoniques</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <BarChart3 className="w-6 h-6 text-blue-600 mb-2" />
                <CardTitle className="text-sm">Appels</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Consultez l'historique des appels</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <Bell className="w-6 h-6 text-blue-600 mb-2" />
                <CardTitle className="text-sm">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Recevez des alertes importantes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CallRounded Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Bienvenue, {user?.name || "Utilisateur"}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Agents Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">0</div>
              <p className="text-xs text-gray-500 mt-1">Agents en ligne</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Appels Aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-xs text-gray-500 mt-1">Appels reçus</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Durée Moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">0m</div>
              <p className="text-xs text-gray-500 mt-1">Durée des appels</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Taux de Réponse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">0%</div>
              <p className="text-xs text-gray-500 mt-1">Appels répondus</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/agents">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Agents Téléphoniques</CardTitle>
                    <CardDescription>Gérez vos agents et leur statut</CardDescription>
                  </div>
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Activez, désactivez et configurez vos agents</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/calls">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Historique des Appels</CardTitle>
                    <CardDescription>Consultez vos conversations</CardDescription>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Filtrez et analysez vos appels</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/phone-numbers">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Numéros de Téléphone</CardTitle>
                    <CardDescription>Gérez vos numéros</CardDescription>
                  </div>
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Associez les numéros à vos agents</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/knowledge-bases">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Bases de Connaissances</CardTitle>
                    <CardDescription>Gérez vos sources</CardDescription>
                  </div>
                  <Bell className="w-8 h-8 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Ajoutez et supprimez des sources</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
