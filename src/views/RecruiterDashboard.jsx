import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const CONTRACT_LABELS = {
  FULL_TIME: 'CDI',
  PART_TIME: 'Temps partiel',
  FREELANCE: 'Freelance',
  FIXED_TERM: 'CDD',
  INTERNSHIP: 'Stage'
};

const REMOTE_LABELS = {
  ON_SITE: 'Présentiel',
  REMOTE: 'Full remote',
  HYBRID: 'Hybride'
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  OPEN: 'Active',
  CLOSED: 'Fermée'
};

const STATUS_COLORS = {
  DRAFT: 'badge-muted',
  OPEN: 'badge-success',
  CLOSED: 'badge-danger'
};

const EMPTY_FORM = {
  title: '',
  company: '',
  location: '',
  description: '',
  contractType: 'FULL_TIME',
  remotePolicy: 'ON_SITE',
  salaryMin: '',
  salaryMax: '',
  status: 'DRAFT',
  requiredSkills: ''
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('offers');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (user?.id) fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.getByRecruiter(user.id);
      setOffers(data || []);
    } catch (err) {
      setError(err.message || 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingOffer(null);
    setForm({ ...EMPTY_FORM, company: user?.fullName ? '' : '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      company: offer.company,
      location: offer.location || '',
      description: offer.description || '',
      contractType: offer.contractType,
      remotePolicy: offer.remotePolicy,
      salaryMin: offer.salaryMin || '',
      salaryMax: offer.salaryMax || '',
      status: offer.status,
      requiredSkills: offer.requiredSkills ? [...offer.requiredSkills].join(', ') : ''
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        recruiterId: user.id,
        title: form.title,
        company: form.company,
        location: form.location || null,
        description: form.description || null,
        contractType: form.contractType,
        remotePolicy: form.remotePolicy,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
        status: form.status,
        requiredSkills: form.requiredSkills
          ? form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : []
      };

      if (editingOffer) {
        const updated = await api.jobs.update(editingOffer.id, payload);
        setOffers(prev => prev.map(o => o.id === updated.id ? updated : o));
      } else {
        const created = await api.jobs.create(payload);
        setOffers(prev => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette offre définitivement ?')) return;
    try {
      await api.jobs.delete(id);
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      alert(err.message || 'Impossible de supprimer l\'offre.');
    }
  };

  const handleToggleStatus = async (offer) => {
    const newStatus = offer.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const updated = await api.jobs.update(offer.id, { ...offer, status: newStatus });
      setOffers(prev => prev.map(o => o.id === updated.id ? updated : o));
    } catch (err) {
      alert(err.message || 'Erreur lors du changement de statut.');
    }
  };

  const openCount = offers.filter(o => o.status === 'OPEN').length;
  const draftCount = offers.filter(o => o.status === 'DRAFT').length;

  return (
    <div className="recruiter-dashboard fade-in container">

      {/* Header */}
      <div className="dash-welcome">
        <div>
          <h1>Bonjour, {user?.firstName || user?.name || 'Recruteur'}</h1>
          <p>Gérez vos offres d'emploi et trouvez les meilleurs talents</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nouvelle offre
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="card stat-card">
          <div className="stat-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total offres</span>
            <h3>{offers.length}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--success)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Offres actives</span>
            <h3>{openCount}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Brouillons</span>
            <h3>{draftCount}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="recruiter-tabs">
        <button className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
          Mes offres
        </button>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          Mon profil
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'offers' && (
          <OffersTab
            offers={offers}
            loading={loading}
            error={error}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onCreate={openCreate}
          />
        )}
        {activeTab === 'profile' && <ProfileTab user={user} />}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay scale-in">
          <div className="card modal-card modal-card-lg">
            <div className="modal-header">
              <h2>{editingOffer ? 'Modifier l\'offre' : 'Nouvelle offre d\'emploi'}</h2>
              <button className="btn-close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            {formError && (
              <div className="alert alert-danger scale-in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Intitulé du poste *</label>
                  <input className="form-control" placeholder="Ex: Développeur Full-Stack React/Java" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Entreprise *</label>
                  <input className="form-control" placeholder="Nom de l'entreprise" value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Type de contrat *</label>
                  <select className="form-control" value={form.contractType}
                    onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))}>
                    {Object.entries(CONTRACT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Télétravail</label>
                  <select className="form-control" value={form.remotePolicy}
                    onChange={e => setForm(f => ({ ...f, remotePolicy: e.target.value }))}>
                    {Object.entries(REMOTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Statut</label>
                  <select className="form-control" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="DRAFT">Brouillon</option>
                    <option value="OPEN">Active</option>
                    <option value="CLOSED">Fermée</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Localisation</label>
                  <input className="form-control" placeholder="Ex: Paris, Lyon, Remote..." value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Compétences requises</label>
                  <input className="form-control" placeholder="React, Java, SQL (séparées par virgule)" value={form.requiredSkills}
                    onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Salaire min (€/an)</label>
                  <input className="form-control" type="number" placeholder="35000" value={form.salaryMin}
                    onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salaire max (€/an)</label>
                  <input className="form-control" type="number" placeholder="50000" value={form.salaryMax}
                    onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description du poste</label>
                <textarea className="form-control" rows="5"
                  placeholder="Décrivez le poste, les missions, le profil recherché..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : editingOffer ? 'Enregistrer' : 'Publier l\'offre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .recruiter-dashboard { padding-top: 10px; padding-bottom: 40px; text-align: left; }
        .dash-welcome { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
        .dash-welcome h1 { font-size: 1.8rem; margin-bottom: 6px; }
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; }
        .stat-icon-wrapper { width: 40px; height: 40px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--primary); background: var(--bg-secondary); border: 1px solid var(--card-border); flex-shrink: 0; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-content .stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
        .stat-content h3 { font-size: 1.25rem; margin-top: 2px; font-weight: 600; }
        .recruiter-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--card-border); margin-bottom: 24px; }
        .tab-btn { background: none; border: none; padding: 10px 20px; font-size: 0.9rem; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: var(--transition-fast); font-weight: 500; }
        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
        .tab-content { min-height: 300px; }
        /* Offer cards */
        .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .offer-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .offer-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .offer-card-title { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin: 0; }
        .offer-card-company { font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px; }
        .offer-card-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .offer-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 500; background: var(--bg-secondary); border: 1px solid var(--card-border); color: var(--text-secondary); }
        .offer-salary { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; }
        .offer-desc { font-size: 0.83rem; color: var(--text-secondary); line-height: 1.45; }
        .offer-skills { display: flex; flex-wrap: wrap; gap: 5px; }
        .skill-chip { padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; background: hsla(255,80%,60%,0.1); color: var(--primary); border: 1px solid hsla(255,80%,60%,0.25); }
        .offer-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--card-border); margin-top: auto; }
        /* badges */
        .badge-success { background: hsla(142,70%,45%,0.15); color: #4ade80; border: 1px solid hsla(142,70%,45%,0.3); }
        .badge-danger { background: hsla(0,70%,60%,0.15); color: #f87171; border: 1px solid hsla(0,70%,60%,0.3); }
        .badge-muted { background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--card-border); }
        .badge-status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        /* empty */
        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 50px 30px; max-width: 480px; margin: 0 auto; }
        .empty-graphic { width: 64px; height: 64px; border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid var(--card-border); }
        .empty-state h3 { font-size: 1.1rem; margin-bottom: 8px; }
        .empty-state p { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px; max-width: 360px; }
        /* modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; }
        .modal-card { width: 100%; max-width: 500px; text-align: left; }
        .modal-card-lg { max-width: 680px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { font-size: 1.25rem; }
        .btn-close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 0.5; transition: var(--transition-fast); }
        .btn-close:hover { color: var(--text-primary); }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 580px) { .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; } }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--card-border); }
        .btn-icon { background: none; border: none; padding: 6px; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition-fast); display: flex; color: var(--text-muted); }
        .btn-icon:hover { background: var(--bg-secondary); color: var(--text-primary); }
        /* profile */
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 600px) { .profile-grid { grid-template-columns: 1fr; } .offers-grid { grid-template-columns: 1fr; } .dash-welcome { flex-direction: column; align-items: flex-start; gap: 12px; } }
        .profile-section { padding: 24px; }
        .profile-section h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 16px; }
        .profile-field { margin-bottom: 14px; }
        .profile-field label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; }
        .profile-field span { font-size: 0.95rem; color: var(--text-primary); font-weight: 500; }
        .profile-field span.empty { color: var(--text-muted); font-style: italic; font-weight: 400; }
      `}</style>
    </div>
  );
}

function OffersTab({ offers, loading, error, onEdit, onDelete, onToggleStatus, onCreate }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
      <span className="spinner large"></span>
      <p style={{ marginTop: '12px' }}>Chargement des offres...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{error}</span>
    </div>
  );

  if (offers.length === 0) return (
    <div className="card empty-state fade-in">
      <div className="empty-graphic">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      </div>
      <h3>Aucune offre publiée</h3>
      <p>Créez votre première offre d'emploi pour attirer des candidats qualifiés.</p>
      <button className="btn btn-primary" onClick={onCreate}>Créer une offre</button>
    </div>
  );

  return (
    <div className="offers-grid">
      {offers.map(offer => (
        <div key={offer.id} className="card offer-card fade-in">
          <div className="offer-card-header">
            <div>
              <span className={`badge-status ${STATUS_COLORS[offer.status]}`}>
                {STATUS_LABELS[offer.status]}
              </span>
              <p className="offer-card-title" style={{ marginTop: '6px' }}>{offer.title}</p>
              <p className="offer-card-company">{offer.company}{offer.location ? ` · ${offer.location}` : ''}</p>
            </div>
            <div className="offer-card-actions">
              <button className="btn-icon" title="Modifier" onClick={() => onEdit(offer)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="btn-icon" title="Supprimer" onClick={() => onDelete(offer.id)}
                style={{ color: 'var(--danger)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <div className="offer-tags">
            <span className="tag">{CONTRACT_LABELS[offer.contractType]}</span>
            <span className="tag">{REMOTE_LABELS[offer.remotePolicy]}</span>
          </div>

          {(offer.salaryMin || offer.salaryMax) && (
            <p className="offer-salary">
              {offer.salaryMin && offer.salaryMax
                ? `${offer.salaryMin.toLocaleString('fr')} – ${offer.salaryMax.toLocaleString('fr')} €/an`
                : offer.salaryMin
                  ? `À partir de ${offer.salaryMin.toLocaleString('fr')} €/an`
                  : `Jusqu'à ${offer.salaryMax.toLocaleString('fr')} €/an`}
            </p>
          )}

          {offer.description && (
            <p className="offer-desc">
              {offer.description.length > 120 ? `${offer.description.substring(0, 120)}...` : offer.description}
            </p>
          )}

          {offer.requiredSkills?.length > 0 && (
            <div className="offer-skills">
              {[...offer.requiredSkills].slice(0, 5).map(s => (
                <span key={s} className="skill-chip">{s}</span>
              ))}
              {offer.requiredSkills.size > 5 && (
                <span className="skill-chip">+{offer.requiredSkills.size - 5}</span>
              )}
            </div>
          )}

          <div className="offer-footer">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('fr-FR') : ''}
            </span>
            <button
              className={`btn btn-sm ${offer.status === 'OPEN' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onToggleStatus(offer)}
            >
              {offer.status === 'OPEN' ? 'Fermer' : 'Activer'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ user }) {
  return (
    <div className="profile-grid">
      <div className="card profile-section">
        <h3>Informations personnelles</h3>
        <div className="profile-field">
          <label>Nom complet</label>
          <span>{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '—'}</span>
        </div>
        <div className="profile-field">
          <label>Adresse e-mail</label>
          <span>{user?.email || '—'}</span>
        </div>
        <div className="profile-field">
          <label>Poste actuel</label>
          <span className={user?.actualPosition ? '' : 'empty'}>{user?.actualPosition || 'Non renseigné'}</span>
        </div>
        <div className="profile-field">
          <label>Téléphone</label>
          <span className={user?.phoneNumber ? '' : 'empty'}>{user?.phoneNumber || 'Non renseigné'}</span>
        </div>
      </div>

      <div className="card profile-section">
        <h3>Pour bien démarrer</h3>
        {[
          'Créez vos premières offres d\'emploi',
          'Définissez clairement le profil recherché',
          'Précisez la fourchette de salaire pour plus de candidatures',
          'Activez les offres quand vous êtes prêt à recevoir des candidatures',
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
