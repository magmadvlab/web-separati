"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  ShoppingBag, 
  Package, 
  TrendingUp,
  ExternalLink,
  Settings,
  AlertCircle,
  CheckCircle2,
  Zap
} from "lucide-react";

export default function ShopFarmaciaPage() {
  const integrazioni = [
    {
      nome: "Shopify",
      descrizione: "Piattaforma e-commerce completa con gestione inventario",
      icon: Store,
      features: ["Gestione prodotti", "Pagamenti integrati", "Analytics avanzate"],
      status: "Consigliato",
      color: "green",
    },
    {
      nome: "PrestaShop",
      descrizione: "Soluzione open-source flessibile e personalizzabile",
      icon: ShoppingBag,
      features: ["Open source", "Moduli personalizzati", "Multi-farmacia"],
      status: "Disponibile",
      color: "blue",
    },
    {
      nome: "WooCommerce",
      descrizione: "Plugin WordPress per e-commerce semplice e veloce",
      icon: Package,
      features: ["Facile da usare", "Temi personalizzabili", "SEO ottimizzato"],
      status: "Disponibile",
      color: "purple",
    },
  ];

  const funzionalitaFuture = [
    "Catalogo prodotti parafarmaceutici",
    "Gestione inventario multi-farmacia",
    "Ordini online con ritiro in farmacia",
    "Promozioni e sconti personalizzati",
    "Programma fedeltà clienti",
    "Integrazione con sistema prescrizioni",
    "Notifiche disponibilità prodotti",
    "Analytics vendite e trend",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            Shop Farmacia
          </h1>
          <p className="text-gray-600 mt-2">
            E-commerce per prodotti parafarmaceutici e integratori
          </p>
        </div>
      </div>

      {/* Alert Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Funzionalità in Sviluppo
              </h3>
              <p className="text-blue-800 text-sm">
                Lo shop online è attualmente in fase di pianificazione. Stiamo valutando le migliori 
                piattaforme e-commerce da integrare per offrire un'esperienza di acquisto ottimale 
                ai tuoi clienti.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrazioni Disponibili */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Piattaforme E-commerce Disponibili
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {integrazioni.map((integrazione) => {
            const Icon = integrazione.icon;
            return (
              <Card key={integrazione.nome} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-3 rounded-lg bg-${integrazione.color}-100`}>
                      <Icon className={`h-6 w-6 text-${integrazione.color}-600`} />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${integrazione.color}-100 text-${integrazione.color}-700 font-medium`}>
                      {integrazione.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{integrazione.nome}</CardTitle>
                  <CardDescription>{integrazione.descrizione}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {integrazione.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Scopri di più
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Funzionalità Future */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funzionalità Pianificate
          </CardTitle>
          <CardDescription>
            Cosa potrai fare con lo shop online
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {funzionalitaFuture.map((funzionalita, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{funzionalita}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestione Multi-Farmacia */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Settings className="h-5 w-5" />
            Gestione Multi-Farmacia
          </CardTitle>
          <CardDescription className="text-purple-700">
            Considerazioni per la gestione di più farmacie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-purple-800">
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Inventario:</span>
              <span>Gestione separata per ogni farmacia con sincronizzazione opzionale</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Ordini:</span>
              <span>Possibilità di ritiro in farmacia specifica o consegna a domicilio</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Prezzi:</span>
              <span>Listini personalizzabili per ogni punto vendita</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Promozioni:</span>
              <span>Campagne locali o network-wide</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl font-bold mb-2">
              Interessato allo Shop Online?
            </h3>
            <p className="mb-4 opacity-90">
              Contatta il supporto per ricevere maggiori informazioni sulle integrazioni 
              e-commerce disponibili e pianificare l'attivazione per la tua farmacia.
            </p>
            <Button variant="secondary" size="lg" disabled>
              Contatta il Supporto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
