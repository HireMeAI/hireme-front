import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
    <div className="auth-container fade-in">
      <div className="auth-glass-card card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logo-grad)" />
              <path d="M2 17L12 22L22 17" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <h2>HireMe AI</h2>
          </div>
          <p className="auth-subtitle">
            {isChooseNewPasswordMode
              ? 'Définissez votre nouveau mot de passe sécurisé'
              : isResetMode 
                ? 'Réinitialiser votre mot de passe' 
                : isLogin 
                  ? 'Accédez à votre espace premium' 
                  : 'Créez votre compte de recrutement intelligent'}
          </p>
        </div>

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
            <div className="form-group">
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
            <div className="form-group">
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
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
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
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        ) : isResetMode ? (
          /* Forgot Password View */
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label className="form-label">Adresse E-mail</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="nom@exemple.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Envoyer le lien de réinitialisation'}
            </button>
            <div className="auth-actions-footer">
              <button type="button" className="btn-link" onClick={() => { setIsResetMode(false); clearAllMessages(); }}>
                Retour à la connexion
              </button>
            </div>
          </form>
        ) : isResendVerificationMode ? (
          /* Resend Verification View */
          <form onSubmit={handleResendVerification} className="auth-form">
            <div className="form-group">
              <label className="form-label">Adresse E-mail</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="nom@exemple.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Renvoyer l'e-mail de confirmation"}
            </button>
            <div className="auth-actions-footer">
              <button type="button" className="btn-link" onClick={() => { setIsResendVerificationMode(false); clearAllMessages(); }}>
                Retour à la connexion
              </button>
            </div>
          </form>
        ) : isLogin ? (
          /* Login View */
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Adresse E-mail</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="nom@exemple.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Mot de passe</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button type="button" className="btn-link text-sm" onClick={() => setIsResetMode(true)}>
                    Mot de passe oublié ?
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>|</span>
                  <button type="button" className="btn-link text-sm" onClick={() => setIsResendVerificationMode(true)}>
                    Email non reçu ?
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
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Se connecter'}
            </button>
            
            <div className="auth-divider">
              <span>ou</span>
            </div>

            <button type="button" className="btn btn-secondary w-100" onClick={switchMode}>
              Créer un compte
            </button>
            {onBackToLanding && (
              <div className="auth-actions-footer">
                <button type="button" className="btn-link text-sm" onClick={onBackToLanding}>
                  ← Retour à l'accueil
                </button>
              </div>
            )}
          </form>
        ) : (
          /* Register View */
          <form onSubmit={handleRegister} className="auth-form">
            {/* Role Selection Tabs */}
            <div className="role-tabs">
              <button 
                type="button" 
                className={`role-tab ${role === 'CANDIDATE' ? 'active' : ''}`}
                onClick={() => setRole('CANDIDATE')}
              >
                Candidat
              </button>
              <button 
                type="button" 
                className={`role-tab ${role === 'RECRUITER' ? 'active' : ''}`}
                onClick={() => setRole('RECRUITER')}
              >
                Recruteur
              </button>
              <button 
                type="button" 
                className={`role-tab ${role === 'ADMIN' ? 'active' : ''}`}
                onClick={() => setRole('ADMIN')}
              >
                Admin
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
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
              <div className="form-group">
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

            <div className="form-group">
              <label className="form-label">Adresse E-mail</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="jean.dupont@exemple.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
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
                <div className="form-group">
                  <label className="form-label">Titre Professionnel</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Développeur Fullstack React / Spring" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Biographie</label>
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
              <div className="form-group">
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

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'S\'inscrire'}
            </button>

            <div className="auth-divider">
              <span>ou</span>
            </div>

            <button type="button" className="btn btn-secondary w-100" onClick={switchMode}>
              Déjà un compte ? Se connecter
            </button>
            {onBackToLanding && (
              <div className="auth-actions-footer">
                <button type="button" className="btn-link text-sm" onClick={onBackToLanding}>
                  ← Retour à l'accueil
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          min-height: calc(100vh - 80px);
        }
        .auth-glass-card {
          width: 100%;
          max-width: 500px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--card-border);
          position: relative;
          overflow: hidden;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .auth-logo h2 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
        .auth-divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        .auth-divider::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: var(--card-border);
          z-index: 1;
        }
        .auth-divider span {
          background: var(--bg-secondary);
          padding: 0 15px;
          font-size: 0.85rem;
          color: var(--text-muted);
          position: relative;
          z-index: 2;
          border-radius: 4px;
        }
        .form-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .text-sm {
          font-size: 0.8rem;
        }
        .role-tabs {
          display: flex;
          background: var(--bg-tertiary);
          padding: 4px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          border: 1px solid var(--card-border);
        }
        .role-tab {
          flex: 1;
          background: none;
          border: none;
          padding: 10px;
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .role-tab.active {
          background: var(--card-bg);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .w-100 {
          width: 100%;
        }
        .auth-actions-footer {
          margin-top: 20px;
          text-align: center;
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
      `}</style>
    </div>
  );
}
