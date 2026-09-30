// src/controllers/logController.ts
import { Request, Response } from 'express';
import AzioneLog, { IAzioneLog } from '../models/azioneLog';
import { computeDiff } from '../utils/diffUtils';
import AlertManager from '../services/alerting/AlertManager';

/**
 * Helper: costruisce la query MongoDB dai filtri comuni
 * Usato sia da cercaLogs che da getStatistiche per garantire coerenza
 */
const buildQuery = (params: Record<string, any>): any => {
  const query: any = {};

  if (params.categoria) query.categoria = params.categoria;
  if (params.criticita) query.criticita = params.criticita;
  if (params.userId) query['origine.id'] = params.userId;
  if (params.tenantId) query['origine.dettagli.tenantId'] = Number(params.tenantId);
  if (params.entita) query['azione.entita'] = params.entita;
  if (params.esito) query['risultato.esito'] = params.esito;
  // Tutti gli eventi della stessa richiesta, in qualunque servizio (ADR039)
  if (params.transazioneId) query['contesto.transazioneId'] = String(params.transazioneId);

  if (params.startDate || params.endDate) {
    query.timestamp = {};
    if (params.startDate) query.timestamp.$gte = new Date(params.startDate as string);
    if (params.endDate) query.timestamp.$lte = new Date(params.endDate as string);
  }

  if (params.search) {
    query.$or = [
      { 'risultato.messaggio': { $regex: params.search, $options: 'i' } },
      { 'azione.operazione': { $regex: params.search, $options: 'i' } },
      { 'azione.entita': { $regex: params.search, $options: 'i' } },
    ];
  }

  return query;
};

/**
 * Crea un nuovo log di azione
 */
export const creaLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const logData = req.body;

    if (!logData.timestamp) logData.timestamp = new Date();

    if (logData.stato && logData.stato.precedente && logData.stato.nuovo && !logData.stato.diff) {
      logData.stato.diff = computeDiff(logData.stato.precedente, logData.stato.nuovo);
    }

    const nuovoLog = new AzioneLog(logData);
    await nuovoLog.save();

    // Hook asincrono: valuta le regole di alerting senza bloccare la risposta
    AlertManager.evaluate(nuovoLog.toObject()).catch((err) =>
      console.error('[logController] AlertManager error:', err.message)
    );

    res.status(201).json(nuovoLog);
  } catch (error: any) {
    console.error('Errore nella creazione del log:', error.message);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};

/**
 * Recupera i log con filtri e paginazione
 */
export const cercaLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, skip, limit = 50, ...filterParams } = req.query;

    const query = buildQuery(filterParams);

    const skipValue = skip !== undefined
      ? Number(skip)
      : (page !== undefined ? Number(page) * Number(limit) : 0);

    const [logs, count] = await Promise.all([
      AzioneLog.find(query).sort({ timestamp: -1 }).skip(skipValue).limit(Number(limit)),
      AzioneLog.countDocuments(query),
    ]);

    const currentPage = skip !== undefined
      ? Math.floor(Number(skip) / Number(limit))
      : (page !== undefined ? Number(page) : 0);

    res.json({
      logs,
      totalCount: count,
      page: currentPage,
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error: any) {
    console.error('Errore nel recupero dei log:', error.message);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};

/**
 * Recupera un log specifico per ID
 */
export const getLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await AzioneLog.findById(id);

    if (!log) {
      res.status(404).json({ message: 'Log non trovato' });
      return;
    }

    res.json(log);
  } catch (error: any) {
    console.error(`Errore nel recupero del log ${req.params.id}:`, error.message);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};

/**
 * Recupera i log associati a una transazione
 */
export const getTransazione = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transazioneId } = req.params;
    const logs = await AzioneLog.find({ 'contesto.transazioneId': transazioneId }).sort({ timestamp: 1 });

    if (logs.length === 0) {
      res.status(404).json({ message: 'Transazione non trovata' });
      return;
    }

    const firstLog = logs.find(log => log.azione.operazione === 'start' && log.azione.entita === 'transaction');
    const lastLog = logs.find(log => log.azione.operazione === 'end' && log.azione.entita === 'transaction');

    let status = 'in_corso';
    if (lastLog) status = lastLog.risultato.esito === 'successo' ? 'completed' : 'failed';

    res.json({
      transazioneId,
      name: firstLog?.azione.dettagli?.name || 'Transazione',
      status,
      startTimestamp: firstLog?.timestamp || null,
      endTimestamp: lastLog?.timestamp || null,
      logs,
    });
  } catch (error: any) {
    console.error(`Errore nel recupero della transazione ${req.params.transazioneId}:`, error.message);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};

/**
 * Recupera statistiche aggregate sui log
 */
export const getStatistiche = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = buildQuery(req.query);

    const total = await AzioneLog.countDocuments(query);

    const categoryStats = await AzioneLog.aggregate([
      { $match: query },
      { $group: { _id: { $ifNull: ['$categoria', null] }, count: { $sum: 1 } } },
    ]);

    const byCategory: Record<string, number> = {
      AUTH: 0, DATA: 0, EMAIL: 0, SYSTEM: 0, AUDIT: 0, SECURITY: 0,
    };
    categoryStats.forEach((s) => {
      if (s._id && s._id in byCategory) byCategory[s._id] = s.count;
    });

    const severityStats = await AzioneLog.aggregate([
      { $match: query },
      { $group: { _id: { $ifNull: ['$criticita', 'INFO'] }, count: { $sum: 1 } } },
    ]);

    const bySeverity: Record<string, number> = {
      INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0,
    };
    severityStats.forEach((s) => {
      if (s._id in bySeverity) bySeverity[s._id] = s.count;
    });

    const outcomeStats = await AzioneLog.aggregate([
      { $match: query },
      { $group: { _id: '$risultato.esito', count: { $sum: 1 } } },
    ]);

    const byOutcome = { successo: 0, fallito: 0, parziale: 0 };
    outcomeStats.forEach((s) => {
      if (s._id && s._id in byOutcome) byOutcome[s._id as keyof typeof byOutcome] = s.count;
    });

    const criticalEvents = await AzioneLog.countDocuments({ ...query, criticita: 'CRITICAL' });

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const lastHourEvents = await AzioneLog.countDocuments({ ...query, timestamp: { $gte: oneHourAgo } });

    const successRateOverall = total > 0 ? (byOutcome.successo / total) * 100 : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const queryLast30 = { ...query, timestamp: { $gte: thirtyDaysAgo } };

    const totalLast30 = await AzioneLog.countDocuments(queryLast30);
    const successLast30 = await AzioneLog.countDocuments({ ...queryLast30, 'risultato.esito': 'successo' });
    const successRateLast30 = totalLast30 > 0 ? (successLast30 / totalLast30) * 100 : 0;

    res.json({
      total,
      byCategory,
      bySeverity,
      byOutcome,
      criticalEvents,
      lastHourEvents,
      successRate: {
        overall: successRateOverall,
        last30Days: successRateLast30,
        trend: successRateLast30 - successRateOverall,
      },
    });
  } catch (error: any) {
    console.error('Errore nel recupero delle statistiche:', error.message);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};

/**
 * Recupera lista utenti distinti presenti nei log
 * Usato per popolare la select del filtro utente nel frontend
 * Restituisce i valori di origine.id ordinati alfabeticamente
 */
export const getUtenti = async (req: Request, res: Response): Promise<void> => {
  try {
    const utenti = await AzioneLog.distinct('origine.id');

    // Ordina alfabeticamente e filtra valori null/vuoti
    const utentiOrdinati = utenti
      .filter((u) => u != null && u !== '')
      .sort((a, b) => String(a).localeCompare(String(b)));

    res.json(utentiOrdinati);
  } catch (error: any) {
    console.error('Errore nel recupero utenti:', error.message);
    res.status(500).json({ message: 'Errore interno del server', error: error.message });
  }
};
