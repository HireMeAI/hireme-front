import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const CONTRACT_LABELS = {
  FULL_TIME: 'Temps plein', PART_TIME: 'Temps partiel', FREELANCE: 'Freelance',
  FIXED_TERM: 'CDD', INTERNSHIP: 'Stage'
};
const REMOTE_LABELS = {
  ON_SITE: 'Présentiel', HYBRID: 'Hybride', REMOTE: 'Télétravail'
};

/** Normalise un score de matching (0..1 ou 0..100) en pourcentage entier. */
const toPercent = (score) => {
  if (score === null || score === undefined) return null;
  const pct = score <= 1 ? score * 100 : score;
  return Math.round(pct);
};

const scoreTone = (pct) => (pct >= 75 ? 'high' : pct >= 50 ? 'mid' : 'low');

export default function Jobs() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]); // enriched: { ...app, jobTitle, resumeTitle, pct }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search filters
  const [keyword, setKeyword] = useState('');
  const [contractType, setContractType] = useState('');
  const [remotePolicy, setRemotePolicy] = useState('');

  // Apply modal
  const [applyJob, setApplyJob] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [note, setNote] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applyResult, setApplyResult] = useState(null); // ApplicationResponse

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.jobs.search({ keyword, contractType, remotePolicy });
      setJobs(list || []);
    } catch (err) {
      setError(err.message || 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  }, [keyword, contractType, remotePolicy]);

  // Aggregate applications across all of the candidate's resumes, enrich + sort by score.
  const loadApplications = useCallback(async (resumeList) => {
    if (!resumeList || resumeList.length === 0) {
      setApplications([]);
      return;
    }
    try {
      const perResume = await Promise.all(
        resumeList.map((r) =>
          api.matching.getByResume(r.id)
            .then((apps) => (apps || []).map((a) => ({ ...a, resumeTitle: r.title })))
            .catch(() => [])
        )
      );
      const flat = perResume.flat();

      // Resolve job titles (cached per unique jobOfferId).
      const jobIds = [...new Set(flat.map((a) => a.jobOfferId))];
      const jobEntries = await Promise.all(
        jobIds.map((id) =>
          api.jobs.getById(id).then((j) => [id, j]).catch(() => [id, null])
        )
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
    } catch (err) {
      // Non-blocking: applications section just stays empty.
      setApplications([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const list = await api.resumes.list(user.id);
        setResumes(list || []);
        await loadApplications(list || []);
      } catch (err) {
        // resumes optional for browsing
      }
    };
    init();
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openApply = (job) => {
    setApplyJob(job);
    setApplyError(null);
    setApplyResult(null);
    setNote('');
    setSelectedResumeId(resumes[0]?.id || '');
  };

  const buildResumeText = (resume) => {
    return [resume?.title, resume?.summary, user?.title, user?.bio]
      .filter(Boolean)
      .join('. ');
  };

  const buildJobText = (job) => {
    const skills = (job.requiredSkills && Array.from(job.requiredSkills)) || [];
    return [job.title, job.description, skills.length ? `Compétences requises: ${skills.join(', ')}` : '']
      .filter(Boolean)
      .join('. ');
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
      const knownPii = [user?.name, user?.lastName, user?.email].filter(Boolean);
      const result = await api.matching.apply({
        candidateId: user.id,
        resumeId: selectedResumeId,
        jobOfferId: applyJob.id,
        resumeText: buildResumeText(resume),
        jobText: buildJobText(applyJob),
        knownPii,
        note: note || undefined,
        source: 'WEB'
      });
      setApplyResult(result);
      await loadApplications(resumes);
    } catch (err) {
      setApplyError(err.message || 'La candidature a échoué.');
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="jobs-view fade-in container">
      <div className="jobs-header">
        <div>
          <h1>Offres d'emploi</h1>
          <p>Parcourez les offres et postulez : notre IA calcule votre score de compatibilité.</p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="card jobs-search">
        <input
          className="form-control"
          placeholder="Rechercher un poste, une techno, une entreprise…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
        />
        <select className="form-control" value={contractType} onChange={(e) => setContractType(e.target.value)}>
          <option value="">Tous contrats</option>
          {Object.entries(CONTRACT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="form-control" value={remotePolicy} onChange={(e) => setRemotePolicy(e.target.value)}>
          <option value="">Tous modes</option>
          {Object.entries(REMOTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn btn-primary" onClick={loadJobs}>Rechercher</button>
      </div>

      {/* My applications */}
      {applications.length > 0 && (
        <section className="jobs-section">
          <h2>Mes candidatures</h2>
          <div className="apps-list">
            {applications.map((a) => (
              <div className="card app-row" key={a.id}>
                <div className="app-main">
                  <strong>{a.jobTitle}</strong>
                  {a.jobCompany && <span className="app-company"> · {a.jobCompany}</span>}
                  <div className="app-meta">
                    <span className="badge badge-secondary">{a.status}</span>
                    <span className="app-cv">CV : {a.resumeTitle}</span>
                  </div>
                </div>
                {a.pct !== null && (
                  <div className={`score-chip score-${scoreTone(a.pct)}`} title="Score de compatibilité IA">
                    {a.pct}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Job listings */}
      <section className="jobs-section">
        <h2>Offres ouvertes</h2>
        {loading ? (
          <p className="muted-line">Chargement des offres…</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : jobs.length === 0 ? (
          <p className="muted-line">Aucune offre ne correspond à votre recherche.</p>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div className="card job-card" key={job.id}>
                <div className="job-card-head">
                  <h3>{job.title}</h3>
                  <span className="job-company">{job.company}</span>
                </div>
                <div className="job-tags">
                  {job.location && <span className="job-tag">📍 {job.location}</span>}
                  {job.contractType && <span className="job-tag">{CONTRACT_LABELS[job.contractType] || job.contractType}</span>}
                  {job.remotePolicy && <span className="job-tag">{REMOTE_LABELS[job.remotePolicy] || job.remotePolicy}</span>}
                  {(job.salaryMin || job.salaryMax) && (
                    <span className="job-tag">
                      {job.salaryMin ? `${job.salaryMin}` : ''}{job.salaryMax ? `–${job.salaryMax}` : ''} €
                    </span>
                  )}
                </div>
                {job.description && <p className="job-desc">{job.description}</p>}
                {job.requiredSkills && Array.from(job.requiredSkills).length > 0 && (
                  <div className="job-skills">
                    {Array.from(job.requiredSkills).slice(0, 6).map((s) => (
                      <span className="skill-pill" key={s}>{s}</span>
                    ))}
                  </div>
                )}
                <div className="job-card-footer">
                  <button className="btn btn-primary btn-sm" onClick={() => openApply(job)}>Postuler</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Apply modal */}
      {applyJob && (
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
        </div>
      )}

      <style>{`
        .jobs-view { padding-bottom: 40px; }
        .jobs-header { margin-bottom: 24px; }
        .jobs-search {
          display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 32px;
        }
        .jobs-search .form-control { flex: 1 1 220px; }
        .jobs-search select.form-control { flex: 0 1 180px; }
        .jobs-section { margin-bottom: 36px; }
        .jobs-section h2 { font-size: 1.4rem; margin-bottom: 16px; }
        .muted-line { color: var(--text-muted); }

        .jobs-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;
        }
        .job-card { display: flex; flex-direction: column; gap: 12px; }
        .job-card-head h3 { font-size: 1.1rem; margin-bottom: 2px; }
        .job-company { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; }
        .job-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .job-tag {
          font-size: 0.74rem; padding: 3px 9px; border-radius: 999px;
          background: var(--bg-tertiary); border: 1px solid var(--card-border); color: var(--text-secondary);
        }
        .job-desc {
          font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .job-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-pill {
          font-size: 0.72rem; padding: 3px 9px; border-radius: 6px;
          background: var(--primary-glow); color: var(--primary); font-weight: 500;
        }
        .job-card-footer { margin-top: auto; display: flex; justify-content: flex-end; }

        .apps-list { display: flex; flex-direction: column; gap: 10px; }
        .app-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px; }
        .app-company { color: var(--text-secondary); font-size: 0.9rem; }
        .app-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .app-cv { font-size: 0.78rem; color: var(--text-muted); }

        .score-chip {
          flex-shrink: 0; font-weight: 700; font-size: 0.95rem;
          padding: 8px 12px; border-radius: var(--radius-sm); min-width: 56px; text-align: center;
        }
        .score-high { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
        .score-mid  { background: hsla(34, 78%, 48%, 0.12); color: var(--warning); border: 1px solid hsla(34, 78%, 48%, 0.25); }
        .score-low  { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border); }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(30, 20, 14, 0.45);
          display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 200;
          backdrop-filter: blur(2px);
        }
        .modal-box { width: 100%; max-width: 460px; }
        .modal-sub { color: var(--text-secondary); margin-bottom: 18px; margin-top: 2px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

        .apply-result { text-align: center; }
        .big-score {
          font-size: 3rem; font-weight: 800; margin: 18px auto; width: fit-content;
          padding: 12px 28px; border-radius: var(--radius-md);
        }
        .result-status { color: var(--text-secondary); }

        @media (max-width: 600px) {
          .jobs-search .form-control, .jobs-search select.form-control { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  );
}
