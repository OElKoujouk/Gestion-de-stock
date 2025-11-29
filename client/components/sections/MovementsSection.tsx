import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export function MovementsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mouvements"
        title="Entrées & sorties tracées"
        description="Chaque mouvement contient le produit, le type, la quantité, l’utilisateur et un commentaire. L’historique est filtrable par date, produit ou utilisateur."
      />
      <Card>
        <CardHeader title="Historique des mouvements" subtitle="Les flux réels apparaîtront ici une fois la fonctionnalité connectée" />
        <p className="text-sm text-slate-600">Plus aucun mock : cette carte restera vide jusqu’à ce que les mouvements soient saisis via l’interface.</p>
      </Card>
    </div>
  );
}
