import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const CONTRACT_LABELS = {
  FULL_TIME: 'CDI', PART_TIME: 'Temps partiel', FREELANCE: 'Freelance',
  FIXED_TERM: 'CDD', INTERNSHIP: 'Stage'
};
const REMOTE_LABELS = {
  ON_SITE: 'Présentiel', HYBRID: 'Hybride', REMOTE: 'Télétravail'
};

const STATUS_LABELS = {
  SUBMITTED: 'Envoyée', VIEWED: 'En revue', ACCEPTED: 'Acceptée', REJECTED: 'Refusée'
};
const STATUS_DOT = {
  SUBMITTED: 'bg-[var(--text-muted)]', VIEWED: 'bg-[var(--info)]',
  ACCEPTED: 'bg-[var(--success)]', REJECTED: 'bg-[var(--danger)]'
};

// Small palette to colour offer logos deterministically by index.
const LOGO_COLORS = ['hsl(12,58%,50%)', 'hsl(210,55%,48%)', 'hsl(150,45%,38%)', 'hsl(34,78%,48%)', 'hsl(270,45%,52%)'];

/** Normalise un score de matching (0..1 ou 0..100) en pourcentage entier. */
const toPercent = (score) => {
  if (score === null || score === undefined) return null;
  const pct = score <= 1 ? score * 100 : score;
  return Math.round(pct);
};
const scorePillClass = (pct) =>
  pct >= 75
    ? 'bg-[var(--success-bg)] text-[var(--success)]'
    : pct >= 50
      ? 'bg-[hsla(34,78%,48%,0.14)] text-[var(--warning)]'
      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';

const scoreTone = (pct) => (pct >= 75 ? 'high' : pct >= 50 ? 'mid' : 'low');

const initialsOf = (text) =>
  (text || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const PANEL = 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[14px] p-[22px]';

export default function Dashboard({ onNavigateToBuilder }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recommendations + applications (right column + stats)
  const [recommendations, setRecommendations] = useState([]);
  const [recoLoading, setRecoLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [detailJob, setDetailJob] = useState(null);

  // Apply modal
  const [applyJob, setApplyJob] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [note, setNote] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applyResult, setApplyResult] = useState(null);

  // Assemble the textual representation of a resume for the matching engine.
  const buildResumeText = (r) => {
    if (!r) return '';
    const parts = [r.title, r.summary, user?.title, user?.bio];
    (r.experiences || []).forEach((exp) =>
      parts.push([exp.position, exp.company, exp.description].filter(Boolean).join(' - ')));
    (r.educations || []).forEach((edu) =>
      parts.push([edu.degree, edu.institution, edu.description].filter(Boolean).join(' - ')));
    const skills = (r.skills || []).map((s) => s.title).filter(Boolean);
    if (skills.length) parts.push(`Compétences: ${skills.join(', ')}`);
    const langs = (r.languages || []).map((l) => l.title).filter(Boolean);
    if (langs.length) parts.push(`Langues: ${langs.join(', ')}`);
    return parts.filter(Boolean).join('. ');
  };

  const buildKnownPii = (r) =>
    [user?.name, user?.firstName, user?.lastName, user?.fullName, user?.email,
      r?.contact?.email, r?.contact?.phone, r?.contact?.linkedin].filter(Boolean);

  const buildJobText = (job) => {
    const skills = (job.requiredSkills && Array.from(job.requiredSkills)) || [];
    return [job.title, job.description, skills.length ? `Compétences requises: ${skills.join(', ')}` : '']
      .filter(Boolean)
      .join('. ');
  };

  const openApply = (job) => {
    setApplyJob(job);
    setApplyError(null);
    setApplyResult(null);
    setNote('');
    setSelectedResumeId(resumes[0]?.id || '');
  };

  const submitApply = async () => {
    if (!selectedResumeId) {
      setApplyError('Veuillez sélectionner un CV.');
      return;
    }
    setApplyLoading(true);
    setApplyError(null);
    try {
      const resume = resumes.find((r) => r.id === selectedResumeId);
      const result = await api.matching.apply({
        candidateId: user.id,
        resumeId: selectedResumeId,
        jobOfferId: applyJob.id,
        resumeText: buildResumeText(resume),
        jobText: buildJobText(applyJob),
        knownPii: buildKnownPii(resume),
        note: note || undefined,
        source: 'WEB'
      });
      setApplyResult(result);
      loadApplications(resumes);
    } catch (err) {
      setApplyError(err.message || 'La candidature a échoué.');
    } finally {
      setApplyLoading(false);
    }
  };

  // Top recommended offers, computed against the candidate's primary resume.
  const loadRecommendations = async (resumeList) => {
    const primary = resumeList[0];
    const resumeText = buildResumeText(primary);
    if (!primary || !resumeText.trim()) {
      setRecommendations([]);
      setRecoLoading(false);
      return;
    }
    setRecoLoading(true);
    try {
      const recos = await api.matching.recommend({
        resumeText,
        knownPii: buildKnownPii(primary),
        topN: 5
      });
      const enriched = await Promise.all(
        (recos || []).map(async (rec) => {
          let job = null;
          try { job = await api.jobs.getById(rec.jobId); } catch { /* offre fermée */ }
          return { jobId: rec.jobId, pct: toPercent(rec.score), job, sharedTerms: rec.sharedTerms };
        })
      );
      setRecommendations(enriched);
    } catch {
      setRecommendations([]);
    } finally {
      setRecoLoading(false);
    }
  };

  // Aggregate applications across every resume, enrich with job title/company.
  const loadApplications = async (resumeList) => {
    if (!resumeList.length) {
      setApplications([]);
      setAppsLoading(false);
      return;
    }
    setAppsLoading(true);
    try {
      const perResume = await Promise.all(
        resumeList.map((r) =>
          api.matching.getByResume(r.id).then((apps) => apps || []).catch(() => []))
      );
      const flat = perResume.flat();
      const jobIds = [...new Set(flat.map((a) => a.jobOfferId))];
      const jobEntries = await Promise.all(
        jobIds.map((id) => api.jobs.getById(id).then((j) => [id, j]).catch(() => [id, null]))
      );
      const jobMap = Object.fromEntries(jobEntries);

      const enriched = flat
        .map((a) => ({
          ...a,
          jobTitle: jobMap[a.jobOfferId]?.title || 'Offre',
          jobCompany: jobMap[a.jobOfferId]?.company || '',
          pct: toPercent(a.matchScore)
        }))
        .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
      setApplications(enriched);
    } catch {
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const list = await api.resumes.list(user.id);
      const resumeList = list || [];
      setResumes(resumeList);

      // Fire the two AI-backed sections in parallel (non-blocking for the page).
      loadRecommendations(resumeList);
      loadApplications(resumeList);
    } catch (err) {
      setError(err.message || 'Impossible de récupérer vos CV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce CV ? Cette action est irréversible.')) return;
    try {
      await api.resumes.delete(id);
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message || 'Impossible de supprimer le CV');
    }
  };

  // Open the full editor in "new" mode (creation now uses the same form as edition).
  const handleCreate = () => onNavigateToBuilder();

  // Derived stats + profile completion
  const checklist = [
    { label: 'Informations personnelles', done: Boolean(user?.name && user?.email) },
    { label: 'Au moins un CV créé', done: resumes.length > 0 },
    { label: 'Expériences ajoutées', done: resumes.some((r) => (r.experiences || []).length > 0) },
    { label: 'Compétences renseignées', done: resumes.some((r) => (r.skills || []).length > 0) }
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const activeApps = applications.filter((a) => a.status !== 'REJECTED').length;

  const stats = [
    { label: 'Offres recommandées', value: recoLoading ? '—' : recommendations.length, icon: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></> },
    { label: 'Candidatures actives', value: appsLoading ? '—' : activeApps, icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
    { label: 'CV créés', value: resumes.length, icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
    { label: 'Profil complété', value: `${completion} %`, icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> }
  ];

  return (
    <div className="fade-in px-9 py-7 max-w-[1180px] text-left max-[760px]:px-4 max-[760px]:py-5">

      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4 mb-[26px] flex-wrap">
        <div>
          <h1 className="text-[1.7rem] mb-1 max-[760px]:text-[1.4rem]">Bonjour, {user?.name || 'Candidat'} 👋</h1>
          <p className="text-[0.95rem]">Voici les offres qui correspondent à votre profil aujourd'hui.</p>
        </div>
        <button className="btn btn-primary max-[500px]:w-full" onClick={handleCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Créer un CV
        </button>
      </div>

      {error && (
        <div className="alert alert-danger scale-in mb-5">
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-[30px] max-[1080px]:grid-cols-2 max-[500px]:grid-cols-1">
        {stats.map((s) => (
          <div key={s.label} className={`${PANEL} !p-[18px] flex items-center gap-3.5`}>
            <div className="w-[42px] h-[42px] rounded-[8px] bg-[var(--primary-glow)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">{s.icon}</svg>
            </div>
            <div>
              <div className="text-[0.78rem] text-[var(--text-muted)]">{s.label}</div>
              <div className="text-[1.5rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: recommended offers + right column */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-[22px] items-start max-[920px]:grid-cols-1">

        {/* Recommended offers */}
        <section className={PANEL}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.1rem]">Offres recommandées pour vous</h2>
            <a onClick={() => navigate('/jobs')} className="text-[0.83rem] font-semibold text-[var(--primary)] cursor-pointer hover:text-[var(--primary-hover)]">Tout voir</a>
          </div>

          {recoLoading ? (
            <div className="text-center py-6 text-[var(--text-muted)]"><span className="spinner"></span><p className="mt-2.5 text-[0.85rem]">Analyse de votre profil…</p></div>
          ) : recommendations.length === 0 ? (
            <p className="text-[var(--text-muted)] text-[0.88rem] italic">
              {resumes.length === 0
                ? 'Créez un CV pour recevoir des recommandations personnalisées.'
                : 'Aucune offre recommandée pour le moment.'}
            </p>
          ) : (
            recommendations.map((rec, i) => (
              <div key={rec.jobId} className="flex items-center gap-3.5 p-3.5 border border-[var(--card-border)] rounded-[8px] mb-2.5 last:mb-0 transition-all hover:shadow-[var(--shadow-sm)] max-[500px]:flex-wrap">
                <div className="w-[42px] h-[42px] rounded-[8px] flex-shrink-0 flex items-center justify-center font-bold text-[0.9rem] text-[var(--primary-foreground)]" style={{ background: LOGO_COLORS[i % LOGO_COLORS.length] }}>
                  {initialsOf(rec.job?.company || rec.job?.title || 'Offre')}
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="text-[0.92rem] block text-[var(--text-primary)]">{rec.job?.title || 'Offre'}</strong>
                  <div className="text-[0.76rem] text-[var(--text-muted)] mt-0.5">
                    {[rec.job?.company, rec.job?.contractType && (CONTRACT_LABELS[rec.job.contractType] || rec.job.contractType),
                      rec.job?.location, rec.job?.remotePolicy && (REMOTE_LABELS[rec.job.remotePolicy] || rec.job.remotePolicy)]
                      .filter(Boolean).join(' · ')}
                  </div>
                  {rec.sharedTerms && rec.sharedTerms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[0.68rem] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Mots-clés en commun :</span>
                      {rec.sharedTerms.map((term) => (
                        <span key={term} className="text-[0.66rem] px-1.5 py-[1px] bg-[var(--primary-glow)] text-[var(--primary)] rounded-full font-medium border border-[rgba(10,127,255,0.15)]">
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5 max-[500px]:flex-row max-[500px]:w-full max-[500px]:justify-between max-[500px]:items-center">
                  {rec.pct !== null && <span className={`text-[0.74rem] font-bold px-2.5 py-[3px] rounded-full ${scorePillClass(rec.pct)}`}>{rec.pct} %</span>}
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => rec.job && setDetailJob(rec.job)} disabled={!rec.job}>Détails</button>
                    {applications.some((a) => a.jobOfferId === rec.jobId) ? (
                      <button className="btn btn-secondary btn-sm" disabled>Déjà postulé</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => rec.job && openApply(rec.job)} disabled={!rec.job}>Postuler</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Right column */}
        <div className="flex flex-col gap-[22px]">

          {/* Profile completion */}
          <section className={PANEL}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-[1.1rem]">Votre profil</h2></div>
            <p className="text-[0.85rem]">Un profil complet améliore vos recommandations.</p>
            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mt-3 mb-2">
              <div className="h-full bg-[var(--primary)] rounded-full transition-[width] duration-[400ms]" style={{ width: `${completion}%` }}></div>
            </div>
            <div className="text-[0.8rem] text-[var(--text-muted)]">{completion} % complété</div>
            <ul className="list-none mt-3 flex flex-col gap-[9px]">
              {checklist.map((c) => (
                <li key={c.label} className={`flex items-center gap-2.5 text-[0.85rem] ${c.done ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'}`}>
                  {c.done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] flex-shrink-0 text-[var(--text-muted)]"><circle cx="12" cy="12" r="10" /></svg>
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
          </section>

          {/* Applications tracking */}
          <section className={PANEL}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[1.1rem]">Mes candidatures</h2>
              <a onClick={() => navigate('/jobs')} className="text-[0.83rem] font-semibold text-[var(--primary)] cursor-pointer hover:text-[var(--primary-hover)]">Tout voir</a>
            </div>
            {appsLoading ? (
              <div className="text-center py-6 text-[var(--text-muted)]"><span className="spinner"></span></div>
            ) : applications.length === 0 ? (
              <p className="text-[var(--text-muted)] text-[0.88rem] italic">Vous n'avez pas encore postulé à une offre.</p>
            ) : (
              applications.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-[11px] border-b border-[var(--card-border)] last:border-b-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[a.status] || 'bg-[var(--text-muted)]'}`}></span>
                  <div className="flex-1 min-w-0">
                    <strong className="text-[0.85rem] block text-[var(--text-primary)]">{a.jobTitle}</strong>
                    <span className="text-[0.74rem] text-[var(--text-muted)]">{[a.jobCompany, a.source === 'AUTO' ? 'auto' : null].filter(Boolean).join(' · ')}</span>
                  </div>
                  <span className="text-[0.72rem] font-semibold px-2.5 py-[3px] rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{STATUS_LABELS[a.status] || a.status}</span>
                </div>
              ))
            )}
          </section>

        </div>
      </div>

      {/* Compact CV list */}
      <section className={`${PANEL} mt-[30px]`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[1.1rem]">Mes CV</h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-[var(--text-muted)]"><span className="spinner"></span><p className="mt-2.5 text-[0.85rem]">Chargement de vos documents…</p></div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[var(--text-muted)] text-[0.88rem] italic">Aucun CV créé pour l'instant.</p>
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Créer mon premier CV</button>
          </div>
        ) : (
          <div className="flex flex-col">
            {resumes.map((resume) => (
              <div key={resume.id} className="flex items-center gap-3 py-3 border-b border-[var(--card-border)] last:border-b-0">
                <div className="w-[38px] h-[38px] rounded-[8px] flex-shrink-0 bg-[var(--primary-glow)] text-[var(--primary)] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="text-[0.9rem] block text-[var(--text-primary)]">{resume.title || 'Sans titre'}</strong>
                  <span className="text-[0.76rem] text-[var(--text-muted)]">{(resume.experiences || []).length} expériences · {(resume.skills || []).length} compétences</span>
                </div>
                <span className={`text-[0.66rem] font-bold tracking-[0.03em] uppercase px-[7px] py-0.5 rounded-[4px] ${resume.visibility === 'PUBLIC' ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                  {resume.visibility === 'PUBLIC' ? 'Public' : resume.visibility === 'PRIVATE' ? 'Privé' : 'Non listé'}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigateToBuilder(resume.id)}>Éditer</button>
                <button onClick={() => handleDelete(resume.id)} title="Supprimer"
                  className="border-none bg-transparent cursor-pointer p-[5px] rounded-md text-[var(--text-muted)] inline-flex hover:bg-[var(--bg-tertiary)] hover:text-[var(--danger)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Details modal — rendu via portal sur document.body */}
      {detailJob && createPortal(
        <div className="modal-overlay" onClick={() => setDetailJob(null)}>
          <div className="card modal-box scale-in !max-w-[560px] max-h-[85vh] overflow-y-auto flex flex-col text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{detailJob.title}</h2>
                <p className="text-[var(--primary)] font-semibold mt-1">{detailJob.company}</p>
              </div>
              <button className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex" onClick={() => setDetailJob(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="border-b border-[var(--card-border)] my-4 w-full"></div>

            <div className="flex flex-wrap gap-2 mb-4">
              {detailJob.location && <span className="job-tag">📍 {detailJob.location}</span>}
              {detailJob.contractType && <span className="job-tag">{CONTRACT_LABELS[detailJob.contractType] || detailJob.contractType}</span>}
              {detailJob.remotePolicy && <span className="job-tag">{REMOTE_LABELS[detailJob.remotePolicy] || detailJob.remotePolicy}</span>}
              {(detailJob.salaryMin || detailJob.salaryMax) && (
                <span className="job-tag">
                  💼 {detailJob.salaryMin ? `${detailJob.salaryMin}` : ''}{detailJob.salaryMax ? `–${detailJob.salaryMax}` : ''} € / an
                </span>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-[0.74rem] font-bold tracking-[0.05em] uppercase text-[var(--text-muted)] mb-2">Description du poste</h4>
              <p className="text-[0.88rem] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{detailJob.description}</p>
            </div>

            {detailJob.requiredSkills && Array.from(detailJob.requiredSkills).length > 0 && (
              <div className="mb-5">
                <h4 className="text-[0.74rem] font-bold tracking-[0.05em] uppercase text-[var(--text-muted)] mb-2">Compétences requises</h4>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(detailJob.requiredSkills).map((s) => (
                    <span className="skill-pill" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions mt-4">
              <button className="btn btn-secondary" onClick={() => setDetailJob(null)}>Fermer</button>
              {applications.some((a) => a.jobOfferId === detailJob.id) ? (
                <button className="btn btn-secondary" disabled>Déjà postulé</button>
              ) : (
                <button className="btn btn-primary" onClick={() => { const j = detailJob; setDetailJob(null); openApply(j); }}>Postuler à cette offre</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Apply modal — rendu via portal sur document.body */}
      {applyJob && createPortal(
        <div className="modal-overlay" onClick={() => !applyLoading && setApplyJob(null)}>
          <div className="card modal-box scale-in" onClick={(e) => e.stopPropagation()}>
            {!applyResult ? (
              <>
                <h2>Postuler — {applyJob.title}</h2>
                <p className="modal-sub">{applyJob.company}</p>

                {resumes.length === 0 ? (
                  <div className="alert alert-danger">
                    Vous devez d'abord créer un CV avant de postuler.
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Choisissez le CV à envoyer</label>
                      <select
                        className="form-control"
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                      >
                        {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Note au recruteur (optionnel)</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Quelques mots sur votre motivation…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {applyError && <div className="alert alert-danger">{applyError}</div>}

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setApplyJob(null)} disabled={applyLoading}>
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitApply}
                    disabled={applyLoading || resumes.length === 0}
                  >
                    {applyLoading ? 'Analyse IA…' : 'Envoyer ma candidature'}
                  </button>
                </div>
              </>
            ) : (
              <div className="apply-result">
                <h2>Candidature envoyée 🎉</h2>
                <p className="modal-sub">Votre compatibilité avec « {applyJob.title} »</p>
                {toPercent(applyResult.matchScore) !== null ? (
                  <div className={`big-score score-${scoreTone(toPercent(applyResult.matchScore))}`}>
                    {toPercent(applyResult.matchScore)}%
                  </div>
                ) : (
                  <p className="muted-line">Score en cours de calcul…</p>
                )}
                <p className="result-status">Statut : <strong>{applyResult.status}</strong></p>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => setApplyJob(null)}>Terminé</button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
