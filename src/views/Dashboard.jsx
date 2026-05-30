import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard({ onNavigateToBuilder }) {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newVisibility, setNewVisibility] = useState('PUBLIC');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // List all resumes for the current logged-in candidate
      // The API client automatically maps `api.resumes.list(userId)`
      const list = await api.resumes.list(user.id);
      setResumes(list || []);

      // Load templates to pre-populate selection dropdown
      const tmplList = await api.templates.list();
      setTemplates(tmplList || []);
    } catch (err) {
      setError(err.message || 'Impossible de récupérer vos CV.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce CV ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await api.resumes.delete(id);
      // Clean delete transition
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message || 'Impossible de supprimer le CV');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    
    try {
      const payload = {
        userId: user.id,
        title: newTitle,
        summary: newSummary,
        portfolioSlug: newSlug || undefined,
        visibility: newVisibility,
        templateId: selectedTemplateId || undefined
      };

      const newResume = await api.resumes.create(payload);
      
      // Close modal & reset fields
      setIsModalOpen(false);
      setNewTitle('');
      setNewSummary('');
      setNewSlug('');
      setNewVisibility('PUBLIC');
      setSelectedTemplateId('');
      
      // Navigate straight to builder with this new CV
      if (newResume && onNavigateToBuilder) {
        onNavigateToBuilder(newResume.id);
      } else {
        fetchData();
      }
    } catch (err) {
      setCreateError(err.message || 'Impossible de créer le CV.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/portfolio/${slug}`;
    navigator.clipboard.writeText(fullUrl)
      .then(() => alert('Lien copié dans le presse-papiers !'))
      .catch(() => alert('Impossible de copier le lien'));
  };

  // Stats derivation
  const publicCount = resumes.filter(r => r.visibility === 'PUBLIC').length;
  const isProfileComplete = user?.bio && user?.title;

  return (
    <div className="dashboard-view fade-in container">
      
      {/* Upper Welcome Header */}
      <div className="dash-welcome">
        <div>
          <h1>Bonjour, {user?.name || 'Candidat'}</h1>
          <p>Gérez vos CV intelligents et propulsez votre carrière avec l'IA</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Créer un CV
        </button>
      </div>

      {/* Widgets & Stats Panel */}
      <div className="stats-row">
        <div className="card stat-card">
          <div className="stat-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total CV</span>
            <h3>{resumes.length}</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Visibilité Publique</span>
            <h3>{publicCount} CV</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Profil professionnel</span>
            <h3>{isProfileComplete ? 'Complet' : 'Incomplet'}</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger scale-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Resumes Section */}
      <div className="resumes-section">
        <h2>Mes Documents et CV</h2>

        {loading ? (
          <div className="dashboard-loading">
            <span className="spinner large"></span>
            <p>Chargement de vos documents...</p>
          </div>
        ) : resumes.length === 0 ? (
          /* Animated Custom Empty State */
          <div className="card empty-state fade-in">
            <div className="empty-graphic">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </div>
            <h3>Aucun CV créé pour l'instant</h3>
            <p>Créez votre tout premier CV intelligent avec notre outil interactif en quelques secondes.</p>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              Créer mon premier CV
            </button>
          </div>
        ) : (
          /* Resume Cards Grid */
          <div className="resumes-grid">
            {resumes.map((resume) => (
              <div key={resume.id} className="card resume-card fade-in">
                <div className="resume-card-header">
                  <div>
                    <span className="badge badge-secondary" style={{ marginBottom: '6px' }}>
                      {resume.visibility}
                    </span>
                    <h3 className="resume-title">{resume.title || 'Sans titre'}</h3>
                  </div>
                  <div className="resume-actions-menu">
                    <button className="btn-icon" onClick={() => handleDelete(resume.id)} title="Supprimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>

                <p className="resume-desc">
                  {resume.summary ? (resume.summary.length > 100 ? `${resume.summary.substring(0, 100)}...` : resume.summary) : 'Aucun résumé professionnel rédigé.'}
                </p>

                <div className="resume-stats-row">
                  <div className="res-stat">
                    <span>Expériences</span>
                    <strong>{resume.experiences?.length || 0}</strong>
                  </div>
                  <div className="res-stat">
                    <span>Formations</span>
                    <strong>{resume.educations?.length || 0}</strong>
                  </div>
                  <div className="res-stat">
                    <span>Compétences</span>
                    <strong>{resume.skills?.length || 0}</strong>
                  </div>
                </div>

                <div className="resume-card-footer">
                  {resume.portfolioSlug ? (
                    <button className="btn-link text-sm" onClick={() => handleCopyLink(resume.portfolioSlug)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px', verticalAlign: 'middle'}}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      Lien public
                    </button>
                  ) : (
                    <span className="text-muted text-sm italic">Lien public inactif</span>
                  )}
                  
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigateToBuilder(resume.id)}>
                    Éditer
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 5"></polyline></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal (CSS-controlled beautiful overlay) */}
      {isModalOpen && (
        <div className="modal-overlay scale-in">
          <div className="card modal-card">
            <div className="modal-header">
              <h2>Nouveau CV intelligent</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            {createError && (
              <div className="alert alert-danger scale-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Titre du CV</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Mon CV Développeur Web" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Accroche</label>
                <textarea 
                  className="form-control" 
                  placeholder="Ex: Développeur passionné par l'IA et les technos web..." 
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Slug de portfolio</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="jean-dupont-dev" 
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Visibilité</label>
                  <select 
                    className="form-control"
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value)}
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="UNLISTED">UNLISTED</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Modèle graphique (Optionnel)</label>
                <select 
                  className="form-control"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">-- Par défaut --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Création...' : 'Créer et Ouvrir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-view {
          padding-top: 10px;
          padding-bottom: 40px;
          text-align: left;
        }
        .dash-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .dash-welcome h1 {
          font-size: 1.8rem;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
        }
        .stat-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          background: var(--bg-secondary);
          border: 1px solid var(--card-border);
        }
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        .stat-content .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .stat-content h3 {
          font-size: 1.25rem;
          margin-top: 2px;
          font-weight: 600;
        }
        .resumes-section h2 {
          font-size: 1.3rem;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .dashboard-loading {
          text-align: center;
          padding: 40px 0;
          color: var(--text-secondary);
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 30px;
          max-width: 500px;
          margin: 0 auto;
        }
        .empty-graphic {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid var(--card-border);
        }
        .empty-state h3 {
          font-size: 1.15rem;
          margin-bottom: 6px;
        }
        .empty-state p {
          font-size: 0.85rem;
          margin-bottom: 16px;
          max-width: 400px;
        }
        .resumes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .resume-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px;
        }
        .resume-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .resume-title {
          font-size: 1.1rem;
          margin-top: 4px;
          font-weight: 600;
        }
        .btn-icon {
          background: none;
          border: none;
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
        }
        .btn-icon:hover {
          background: var(--bg-secondary);
        }
        .resume-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
          flex-grow: 1;
          line-height: 1.4;
        }
        .resume-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-top: 1px solid var(--card-border);
          border-bottom: 1px solid var(--card-border);
          padding: 10px 0;
          margin-bottom: 16px;
          text-align: center;
        }
        .res-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .res-stat span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .res-stat strong {
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .resume-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-link {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
        }
        .btn-link:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }
        .italic {
          font-style: italic;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          width: 100%;
          max-width: 500px;
          text-align: left;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h2 {
          font-size: 1.3rem;
        }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-muted);
          cursor: pointer;
          line-height: 0.5;
          transition: var(--transition-fast);
        }
        .btn-close:hover {
          color: var(--text-primary);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 500px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 14px;
          border-top: 1px solid var(--card-border);
        }
      `}</style>
    </div>
  );
}
