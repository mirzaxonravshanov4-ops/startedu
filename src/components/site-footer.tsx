import { useSubject } from "@/lib/subject";
import { Link } from "@tanstack/react-router";
import { Sigma } from "lucide-react";

export function SiteFooter() {
  const subject = useSubject();
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary">
              <Sigma className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="text-base font-semibold tracking-tight">
              Start<span className="gradient-text">Edu</span>
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            O'zbekistondagi eng zamonaviy matematika platformasi. Milliy sertifikat, DTM,
            attestatsiya, SAT math va olimpiada — bir joyda.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Muallif: <span className="font-medium text-foreground">Mirzaxon Ravshanov</span>
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Yo'nalishlar</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/$subject/milliy-sertifikat" params={{ subject }} className="hover:text-foreground">Milliy sertifikat</Link></li>
            <li><Link to="/$subject/dtm" params={{ subject }} className="hover:text-foreground">DTM testlar</Link></li>
            <li><Link to="/$subject/attestatsiya" params={{ subject }} className="hover:text-foreground">Attestatsiya</Link></li>
            <li><Link to="/$subject/sat" params={{ subject }} className="hover:text-foreground">SAT math</Link></li>
            <li><Link to="/$subject/olimpiada" params={{ subject }} className="hover:text-foreground">Olimpiada</Link></li>
            <li><Link to="/$subject/videos" params={{ subject }} className="hover:text-foreground">Video darslar</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Kompaniya</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">Biz haqimizda</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ &amp; Aloqa</Link></li>
            <li><Link to="/$subject/dashboard" params={{ subject }} className="hover:text-foreground">Dashboard</Link></li>
            <li><a href="mailto:hello@startedu.uz" className="hover:text-foreground">Aloqa</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} StartEdu. Muallif: Mirzaxon Ravshanov. Barcha huquqlar
            himoyalangan.
          </p>
          <p>O'zbekiston, Samarqand</p>
        </div>
      </div>
    </footer>
  );
}
