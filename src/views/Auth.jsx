import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Logo from '../components/Logo';

export default function Auth({ 
  initialMode = 'login', 
  onBackToLanding, 
  resetToken = null, 
  onResetTokenCleared, 
  appNotification = null, 
  onClearNotification 
}) {
  const { login, error: authError, setError: setAuthError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isResendVerificationMode, setIsResendVerificationMode] = useState(false);
  const [isChooseNewPasswordMode, setIsChooseNewPasswordMode] = useState(!!resetToken);
  const [role, setRole] = useState('CANDIDATE'); // CANDIDATE, RECRUITER, ADMIN
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Role specific fields
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const clearAllMessages = () => {
    setError(null);
    setMessage(null);
    setAuthError(null);
    if (onClearNotification) onClearNotification();
  };

  useEffect(() => {
    setIsLogin(initialMode !== 'register');
    setIsResetMode(false);
    setIsResendVerificationMode(false);
    setIsChooseNewPasswordMode(!!resetToken);
    clearAllMessages();
  }, [initialMode, resetToken]);

  const switchMode = () => {
    setIsLogin(!isLogin);
    setIsResetMode(false);
    setIsResendVerificationMode(false);
    setIsChooseNewPasswordMode(false);
    if (onResetTokenCleared) onResetTokenCleared();
    clearAllMessages();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (role === 'CANDIDATE') {
        await api.auth.register(email, password, name, lastName, bio, title);
      } else if (role === 'RECRUITER') {
        await api.auth.registerRecruiter(email, password, name, lastName, companyName);
      } else {
        await api.auth.registerAdmin(email, password, name, lastName);
      }
      
      setMessage('Compte créé avec succès ! Veuillez vérifier vos e-mails pour confirmer votre compte.');
      // Clear forms
      setPassword('');
      setIsLogin(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearAllMessages();
    setLoading(true);
    try {
      await api.auth.resetPasswordEmail(email);
      setMessage('Si l\'adresse e-mail est enregistrée, vous recevrez un lien de réinitialisation.');
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    clearAllMessages();
    setLoading(true);
    try {
      await api.auth.resendVerificationEmail(email);
      setMessage('Un nouvel e-mail de confirmation a été envoyé si l\'adresse est enregistrée.');
    } catch (err) {
      setError(err.message || 'Erreur lors du renvoi de l\'e-mail de confirmation.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewPassword = async (e) => {
    e.preventDefault();
    clearAllMessages();
    
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.confirmResetPassword(resetToken, newPassword);
      setMessage('Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter.');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsChooseNewPasswordMode(false);
      if (onResetTokenCleared) onResetTokenCleared();
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in">
      {/* ============ PANNEAU MARQUE (gauche) ============ */}
      <aside className="auth-aside">
        <Logo className="aside-logo" />

        <div className="aside-main">
          <h2>Le bon poste trouve le bon profil.</h2>
          <p>HireMe met en relation candidats et recruteurs grâce au matching IA : recommandations d'offres, candidatures automatiques et profils classés par pertinence.</p>
          <ul className="aside-points">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Offres recommandées selon votre profil
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Candidature automatique aux postes pertinents
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              CV et portfolio en ligne partageables
            </li>
          </ul>
        </div>

        <div className="aside-foot">© 2026 HireMe</div>
      </aside>

      {/* ============ PANNEAU FORMULAIRE (droite) ============ */}
      <main className="auth-main">
        <div className="auth-card">
          {onBackToLanding && (
            <button 
              type="button" 
              className="back-link" 
              onClick={onBackToLanding}
              style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Retour à l'accueil
            </button>
          )}

          {/* switch connexion / inscription */}
          {!isChooseNewPasswordMode && !isResetMode && !isResendVerificationMode && (
            <div className="mode-switch">
              <button 
                type="button"
                className={`mode-btn ${isLogin ? 'active' : ''}`}
                onClick={() => {
                  if (!isLogin) {
                    switchMode();
                  }
                }}
              >
                Connexion
              </button>
              <button 
                type="button"
                className={`mode-btn ${!isLogin ? 'active' : ''}`}
                onClick={() => {
                  if (isLogin) {
                    switchMode();
                  }
                }}
              >
                Créer un compte
              </button>
            </div>
          )}

          {/* Global Notifications */}
          {appNotification && (
            <div className={`alert alert-${appNotification.type === 'danger' ? 'danger' : 'success'} scale-in`}>
              {appNotification.type === 'danger' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              )}
              <span>{appNotification.text}</span>
            </div>
          )}

          {(error || authError) && (
            <div className="alert alert-danger scale-in">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>{error || authError}</span>
            </div>
          )}

          {message && (
            <div className="alert alert-success scale-in">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>{message}</span>
            </div>
          )}

          {isChooseNewPasswordMode ? (
            /* New Password Confirmation View */
            <form onSubmit={handleConfirmNewPassword} className="auth-form">
              <div className="auth-head">
                <h1>Nouveau mot de passe 🔒</h1>
                <p>Définissez votre nouveau mot de passe sécurisé</p>
              </div>
              <div className="field">
                <label className="form-label">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Min. 8 caractères" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="field">
                <label className="form-label">Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Confirmez votre mot de passe" 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Mettre à jour le mot de passe'}
              </button>
              <div className="auth-actions-footer">
                <button 
                  type="button" 
                  className="btn-link text-sm" 
                  onClick={() => {
                    setIsChooseNewPasswordMode(false);
                    if (onResetTokenCleared) onResetTokenCleared();
                    clearAllMessages();
                  }}
                  style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          ) : isResetMode ? (
            /* Forgot Password View */
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="auth-head">
                <h1>Mot de passe oublié ? 🤔</h1>
                <p>Saisissez votre e-mail pour recevoir un lien de réinitialisation.</p>
              </div>
              <div className="field">
                <label className="form-label">Adresse e-mail</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="nom@exemple.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Envoyer le lien'}
              </button>
              <div className="auth-actions-footer">
                <button 
                  type="button" 
                  className="btn-link" 
                  onClick={() => { setIsResetMode(false); clearAllMessages(); }}
                  style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          ) : isResendVerificationMode ? (
            /* Resend Verification View */
            <form onSubmit={handleResendVerification} className="auth-form">
              <div className="auth-head">
                <h1>E-mail de confirmation ✉️</h1>
                <p>Saisissez votre e-mail pour renvoyer le lien de confirmation.</p>
              </div>
              <div className="field">
                <label className="form-label">Adresse e-mail</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="nom@exemple.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : "Renvoyer l'e-mail"}
              </button>
              <div className="auth-actions-footer">
                <button 
                  type="button" 
                  className="btn-link" 
                  onClick={() => { setIsResendVerificationMode(false); clearAllMessages(); }}
                  style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          ) : isLogin ? (
            /* Login View */
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-head">
                <h1>Bon retour 👋</h1>
                <p>Connectez-vous pour accéder à votre espace.</p>
              </div>
              <div className="field">
                <label className="form-label">Adresse e-mail</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="nom@exemple.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="field">
                <div className="label-row">
                  <label className="form-label">Mot de passe</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-link text-sm" 
                      onClick={() => setIsResetMode(true)}
                      style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer', fontWeight: 550 }}
                    >
                      Mot de passe oublié ?
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>|</span>
                    <button 
                      type="button" 
                      className="btn-link text-sm" 
                      onClick={() => setIsResendVerificationMode(true)}
                      style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer', fontWeight: 550 }}
                    >
                      Non reçu ?
                    </button>
                  </div>
                </div>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : (
                  <>
                    Se connecter
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>
              
              <div className="divider">ou</div>

              <button type="button" className="btn-social" onClick={() => alert('Fonctionnalité sociale de démonstration')}>
                <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuer avec Google
              </button>
              
              <p className="auth-foot">
                Pas encore de compte ?{' '}
                <button type="button" onClick={switchMode}>
                  Créer un compte
                </button>
              </p>
            </form>
          ) : (
            /* Register View */
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-head">
                <h1>Créer un compte</h1>
                <p>Quelques infos et c'est parti.</p>
              </div>

              {/* Role Selection Cards */}
              <div className="role-select">
                <button 
                  type="button" 
                  className={`role-card ${role === 'CANDIDATE' ? 'active' : ''}`}
                  onClick={() => setRole('CANDIDATE')}
                >
                  <div className="role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <strong>Candidat</strong>
                  <span>Je cherche un poste</span>
                </button>
                <button 
                  type="button" 
                  className={`role-card ${role === 'RECRUITER' ? 'active' : ''}`}
                  onClick={() => setRole('RECRUITER')}
                >
                  <div className="role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <strong>Recruteur</strong>
                  <span>Je publie des offres</span>
                </button>
                <button 
                  type="button" 
                  className={`role-card ${role === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => setRole('ADMIN')}
                >
                  <div className="role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <strong>Admin</strong>
                  <span>Je gère le système</span>
                </button>
              </div>

              <div className="field field-row">
                <div>
                  <label className="form-label">Prénom</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Jean" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">Nom</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Dupont" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="field">
                <label className="form-label">Adresse e-mail</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="jean.dupont@exemple.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <div className="field">
                <label className="form-label">Mot de passe</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Min. 8 caractères" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              {/* Candidate-specific fields */}
              {role === 'CANDIDATE' && (
                <>
                  <div className="field">
                    <label className="form-label">Titre professionnel</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Développeur Fullstack React / Spring" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="field">
                    <label className="form-label">Biographie <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
                    <textarea 
                      className="form-control" 
                      placeholder="Racontez votre parcours en quelques lignes..." 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Recruiter-specific fields */}
              {role === 'RECRUITER' && (
                <div className="field">
                  <label className="form-label">Nom de l'entreprise</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Tech Solutions SAS" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required 
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : (
                  <>
                    Créer mon compte
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>

              <p className="auth-foot">
                Déjà un compte ?{' '}
                <button type="button" onClick={switchMode}>
                  Se connecter
                </button>
              </p>
            </form>
          )}
        </div>
      </main>

      <style>{`
        .auth-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          width: 100%;
        }

        /* panneau marque (gauche) */
        .auth-aside {
          background: var(--primary);
          color: var(--primary-foreground);
          padding: 48px 56px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
        }
        .aside-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--primary-foreground) !important;
        }
        .aside-logo svg {
          width: 28px;
          height: 28px;
        }
        .aside-logo svg rect {
          fill: var(--primary-foreground) !important;
        }
        .aside-logo svg path {
          stroke: var(--primary) !important;
        }
        .aside-logo span {
          color: var(--primary-foreground) !important;
        }
        .aside-main {
          max-width: 380px;
        }
        .aside-main h2 {
          font-size: 2rem;
          line-height: 1.2;
          margin-bottom: 16px;
          color: var(--primary-foreground);
        }
        .aside-main p {
          color: hsla(40, 33%, 98%, 0.82);
          font-size: 1.02rem;
        }
        .aside-points {
          list-style: none;
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .aside-points li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: hsla(40, 33%, 98%, 0.92);
          font-size: 0.95rem;
          text-align: left;
        }
        .aside-points svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        .aside-foot {
          font-size: 0.82rem;
          color: hsla(40, 33%, 98%, 0.6);
        }

        /* panneau formulaire (droite) */
        .auth-main {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background-color: var(--bg-primary);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          text-align: left;
        }
        .auth-head {
          margin-bottom: 28px;
          text-align: left;
        }
        .auth-head h1 {
          font-size: 1.7rem;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        .auth-head p {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        /* switch connexion / inscription */
        .mode-switch {
          display: flex;
          background: var(--bg-tertiary);
          border: 1px solid var(--card-border);
          padding: 4px;
          border-radius: 999px;
          margin-bottom: 28px;
        }
        .mode-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 9px 0;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: 999px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .mode-btn:hover {
          color: var(--text-primary);
        }
        .mode-btn.active {
          background: var(--card-bg);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        /* sélecteur de rôle (inscription) */
        .role-select {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 22px;
        }
        .role-card {
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          border-radius: var(--radius-sm);
          padding: 14px;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
          font-family: inherit;
          color: var(--text-primary);
        }
        .role-card:hover {
          border-color: var(--card-border-hover);
        }
        .role-card.active {
          border-color: var(--primary);
          background: var(--primary-glow);
        }
        .role-card .role-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .role-card.active .role-icon {
          background: var(--primary);
          color: var(--primary-foreground);
        }
        .role-card .role-icon svg {
          width: 17px;
          height: 17px;
        }
        .role-card strong {
          display: block;
          font-size: 0.88rem;
          margin-bottom: 2px;
        }
        .role-card span {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        /* FORMULAIRE */
        .field {
          margin-bottom: 16px;
          text-align: left;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .form-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
          text-align: left;
        }
        .label-row .form-label {
          margin-bottom: 0;
        }
        .label-row a {
          font-size: 0.8rem;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: 11px 14px;
          font-family: inherit;
          font-size: 0.92rem;
          background: var(--bg-secondary);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          transition: var(--transition-fast);
          box-sizing: border-box;
        }
        .form-control::placeholder {
          color: var(--text-muted);
        }
        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          background: var(--bg-secondary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
        textarea.form-control {
          resize: vertical;
          min-height: 84px;
        }

        /* boutons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 18px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition);
          box-sizing: border-box;
        }
        .btn-primary {
          background-color: var(--primary);
          color: var(--primary-foreground);
          box-shadow: var(--shadow-sm);
          margin-top: 6px;
        }
        .btn-primary:hover {
          background-color: var(--primary-hover);
        }
        .btn svg {
          width: 16px;
          height: 16px;
        }

        /* séparateur + social */
        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 22px 0;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--card-border);
        }
        .btn-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px 18px;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 600;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition);
          box-sizing: border-box;
        }
        .btn-social:hover {
          border-color: var(--card-border-hover);
          background: var(--bg-tertiary);
        }
        .btn-social svg {
          width: 18px;
          height: 18px;
        }

        .auth-foot {
          margin-top: 22px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .auth-foot button {
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--primary);
          cursor: pointer;
        }
        .auth-foot button:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 24px;
          transition: var(--transition-fast);
        }
        .back-link:hover {
          color: var(--text-primary);
        }
        .back-link svg {
          width: 15px;
          height: 15px;
        }

        /* alert rules */
        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
          font-size: 0.88rem;
          text-align: left;
        }
        .alert-danger {
          background-color: var(--danger-bg);
          color: var(--danger);
        }
        .alert-success {
          background-color: var(--success-bg);
          color: var(--success);
        }
        .alert svg {
          flex-shrink: 0;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* RESPONSIVE */
        @media (max-width: 860px) {
          .auth-wrapper {
            grid-template-columns: 1fr;
          }
          .auth-aside {
            display: none;
          }
          .auth-main {
            padding: 40px 20px;
          }
        }
      `}</style>
    </div>
  );
}
