// =============================================================================
// Rotte di Vigilo, montate su /api/vigilo
// =============================================================================
// Ogni area (dominio) porta le sue rotte; qui solo l'ordine e i controlli
// comuni: richiesta dal gateway con utente valido e tenant (ADR068). Il
// modulo 'vigilo' in vigore lo verifica gia' il gateway (ADR060).
// Unica eccezione: /pubblico (B8d-4), solo col segreto del gateway e senza
// utente; il gateway la apre senza JWT con un limite di richieste per IP.
// =============================================================================
import { Router } from 'express';
import './modelli'; // modelli e associazioni prima delle rotte
import { requireAuth, requireGatewaySecret, requireTenant } from '../core/middleware/auth';
import { ioRoutes } from './io/io.routes';
import { categorieRoutes } from './categorie/categoria.routes';
import { controlliRoutes } from './controlli/controllo.routes';
import { soggettiRoutes } from './soggetti/soggetto.routes';
import { assegnazioniRoutes } from './soggetti/assegnazione.routes';
import { fornitoriRoutes } from './fornitori/fornitore.routes';
import { contatoriRoutes } from './contatori/contatore.routes';
import { scadenzeRoutes } from './scadenze/scadenza.routes';
import { avvioRoutes } from './avvio/avvio.routes';
import { dashboardRoutes } from './dashboard/dashboard.routes';
import { calendarioRoutes } from './calendario/calendario.routes';
import { libreriaRoutes } from './libreria/libreria.routes';
import { avvisiRoutes } from './avvisi/avviso.routes';
import { impostazioniRoutes } from './impostazioni/impostazioni.routes';
import { recapitiRoutes } from './avvisi/recapiti.routes';
import { allegatiRoutes } from './allegati/allegato.routes';
import { segnalazioniRoutes } from './segnalazioni/segnalazione.routes';
import { interventiRoutes } from './interventi/interventi.routes';

const router = Router();

router.use('/pubblico', requireGatewaySecret, recapitiRoutes);
router.use(requireAuth, requireTenant);
router.use(ioRoutes);
router.use(categorieRoutes);
router.use(controlliRoutes);
router.use(soggettiRoutes);
router.use(assegnazioniRoutes);
router.use(fornitoriRoutes);
router.use(contatoriRoutes);
router.use(scadenzeRoutes);
router.use(avvioRoutes);
router.use(dashboardRoutes);
router.use(calendarioRoutes);
router.use(libreriaRoutes);
router.use(avvisiRoutes);
router.use(impostazioniRoutes);
router.use(allegatiRoutes);
router.use(segnalazioniRoutes);
router.use(interventiRoutes);

export default router;
