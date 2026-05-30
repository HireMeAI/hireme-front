import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user, syncProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLastName(user.lastName || '');
      setTitle(user.title || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    setLoading(true);
    
    try {
      // updateProfile accepts { name, lastName, bio, title }
      await api.candidate.updateProfile({ name, lastName, bio, title });
      // Sync AuthContext so modifications reflect globally
      await syncProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-view fade-in container">
      <div className="profile-layout">
        
        {/* Left Side: Avatar Card */}
        <div className="profile-sidebar">
          <div className="card avatar-card">
            <div className="avatar-circle">
              {name ? name.charAt(0).toUpperCase() : 'U'}
              {lastName ? lastName.charAt(0).toUpperCase() : ''}
            </div>
            <h3>{name} {lastName}</h3>
            <span className="badge badge-primary">{user?.role || 'Candidat'}</span>
            <p className="profile-sidebar-email">{user?.email}</p>
            <div className="divider"></div>
            <div className="stats-mini">
              <div className="stat-item">
                <span className="stat-label">Titre</span>
                <span className="stat-value">{title || 'Non renseigné'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="profile-main">
          <div className="card profile-form-card">
            <div className="card-header-block">
              <h2>Mon Profil Professionnel</h2>
              <p>Mettez à jour vos informations personnelles et professionnelles</p>
            </div>

            {error && (
              <div className="alert alert-danger scale-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success scale-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>Profil mis à jour avec succès !</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom de famille</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Titre Professionnel</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Développeur Senior Java / React"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biographie / Description</label>
                <textarea 
                  className="form-control bio-textarea" 
                  placeholder="Présentez-vous en quelques phrases aux recruteurs..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="6"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <style>{`
        .profile-view {
          padding-top: 10px;
          padding-bottom: 40px;
        }
        .profile-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }
        }
        .avatar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px;
        }
        .avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-round);
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid var(--card-border);
          box-shadow: var(--shadow-sm);
        }
        .avatar-card h3 {
          font-size: 1.15rem;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .profile-sidebar-email {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 8px;
        }
        .divider {
          width: 100%;
          height: 1px;
          background: var(--card-border);
          margin: 16px 0;
        }
        .stats-mini {
          width: 100%;
          text-align: left;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .stat-value {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .profile-form-card {
          text-align: left;
        }
        .card-header-block {
          margin-bottom: 24px;
        }
        .card-header-block h2 {
          font-size: 1.3rem;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        .card-header-block p {
          font-size: 0.88rem;
          color: var(--text-secondary);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
        .bio-textarea {
          line-height: 1.4;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--card-border);
        }
      `}</style>
    </div>
  );
}
