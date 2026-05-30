import React from 'react';

export default function Landing({ onNavigateToLogin, onNavigateToRegister }) {
  return (
    <div className="landing-view fade-in">
      
      {/* Landing Header/Navbar */}
      <header className="landing-header">
        <div className="landing-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logo-grad-landing)" />
            <path d="M2 17L12 22L22 17" stroke="url(#logo-grad-landing)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="url(#logo-grad-landing)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="logo-grad-landing" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--primary)" />
                <stop offset="1" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <span>HireMe AI</span>
        </div>
        <div className="landing-header-actions">
          <button className="nav-btn-link" onClick={onNavigateToLogin}>Se connecter</button>
          <button className="btn btn-primary btn-sm" onClick={onNavigateToRegister}>Créer un compte</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section container">
        <div className="hero-content">
          <span className="hero-badge scale-in">Révolutionnez votre recherche d'emploi</span>
          <h1>Propulsez votre carrière avec l'IA.</h1>
          <p>
            Concevez des CV intelligents, esthétiques et percutants en quelques minutes. 
            Bénéficiez de mises en page haut de gamme ajustées en temps réel et partagez votre portfolio en un clic.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onNavigateToRegister}>
              Commencer gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 5"></polyline></svg>
            </button>
            <button className="btn btn-secondary" onClick={onNavigateToLogin}>
              Se connecter
            </button>
          </div>
        </div>

        {/* Crisp SaaS Floating Preview Mockup */}
        <div className="hero-visual">
          <div className="floating-card-wrapper">
            <div className="card floating-preview-card scale-in">
              <div className="card-header-bar">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
                <span className="preview-label">Aperçu interactif</span>
              </div>
              <div className="mock-cv">
                <div className="mock-header">
                  <div className="mock-avatar">JD</div>
                  <div>
                    <h4>Jean Dupont</h4>
                    <span className="mock-title">Développeur Fullstack React / Spring</span>
                  </div>
                </div>
                <div className="mock-divider"></div>
                <div className="mock-body">
                  <div className="mock-section">
                    <h5>COMPÉTENCES CLÉS</h5>
                    <div className="mock-tags">
                      <span>React</span>
                      <span>Spring Boot</span>
                      <span>PostgreSQL</span>
                      <span>Docker</span>
                    </div>
                  </div>
                  <div className="mock-section">
                    <h5>DERNIÈRE EXPÉRIENCE</h5>
                    <div className="mock-experience">
                      <strong>Développeur Fullstack</strong> - Tech Solutions
                      <p>Conception et déploiement d'une architecture microservices robuste et performante.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="features-section container">
        <div className="section-intro">
          <h2>Conçu pour l'excellence.</h2>
          <p>Profitez de fonctionnalités de pointe pour vous démarquer auprès des recruteurs.</p>
        </div>

        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <h4>Modèles de Rendu Premium</h4>
            <p>Basculez instantanément entre nos thèmes graphiques haut de gamme (Moderne, Slate, Executive) calibrés pour les recruteurs.</p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h4>Partage par Lien Public</h4>
            <p>Générez un slug unique (ex: `jean-dupont-dev`) pour votre portfolio en ligne et partagez-le en un clic.</p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            </div>
            <h4>Éditeur Temps Réel</h4>
            <p>Saisissez vos formations, expériences, compétences et langues et observez le rendu final A4 se mettre à jour en temps réel.</p>
          </div>
        </div>
      </section>

      {/* Step-by-Step section */}
      <section className="steps-section container">
        <div className="section-intro">
          <h2>Comment ça marche ?</h2>
          <p>Un parcours simplifié pour un résultat professionnel.</p>
        </div>

        <div className="steps-flow">
          <div className="step-item card">
            <span className="step-num">01</span>
            <h4>Créez votre compte</h4>
            <p>Inscrivez-vous en tant que candidat pour accéder à votre espace de gestion premium.</p>
          </div>
          <div className="step-item card">
            <span className="step-num">02</span>
            <h4>Remplissez vos blocs</h4>
            <p>Ajoutez vos expériences marquantes, vos formations et vos compétences clés.</p>
          </div>
          <div className="step-item card">
            <span className="step-num">03</span>
            <h4>Sélectionnez & Partagez</h4>
            <p>Choisissez votre mise en page préférée et copiez le lien public de votre portfolio.</p>
          </div>
        </div>
      </section>

      {/* CTA Final Banner */}
      <section className="cta-banner container">
        <div className="card cta-card">
          <h3>Prêt à concevoir votre CV intelligent ?</h3>
          <p>Rejoignez des milliers de professionnels qui se démarquent grâce à nos technologies.</p>
          <button className="btn btn-primary btn-lg" onClick={onNavigateToRegister}>
            Concevoir mon CV maintenant
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 HireMe AI. Développé pour l'excellence professionnelle.</p>
      </footer>

      <style>{`
        .landing-view {
          position: relative;
          color: var(--text-primary);
        }

        .landing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 5%;
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: rgba(9, 10, 11, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--card-border);
          transition: var(--transition);
        }
        body.light-theme .landing-header {
          background-color: rgba(255, 255, 255, 0.8);
        }
        .landing-logo {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-primary);
        }
        .landing-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-section {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 40px;
          align-items: center;
          padding: 80px 0 60px;
          text-align: left;
        }
        @media (max-width: 900px) {
          .hero-section {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 40px 0;
          }
        }
        .hero-badge {
          display: inline-block;
          padding: 4px 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--card-border);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .hero-content h1 {
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          line-height: 1.15;
          margin-bottom: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .hero-content p {
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
        }
        @media (max-width: 900px) {
          .hero-actions {
            justify-content: center;
          }
        }

        /* Product Mockup Visuals */
        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .floating-card-wrapper {
          position: relative;
          width: 100%;
          max-width: 380px;
        }
        .floating-preview-card {
          width: 100%;
          padding: 0 !important;
          background-color: var(--bg-secondary) !important;
          border: 1px solid var(--card-border) !important;
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-md) !important;
          transition: var(--transition);
        }
        .floating-preview-card:hover {
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        body.light-theme .floating-preview-card:hover {
          border-color: rgba(0, 0, 0, 0.15) !important;
        }
        .card-header-bar {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--card-border);
          border-top-left-radius: var(--radius-md);
          border-top-right-radius: var(--radius-md);
        }
        body.light-theme .card-header-bar {
          background: rgba(0, 0, 0, 0.02);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #eab308; }
        .dot-green { background: #22c55e; }
        .preview-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-left: auto;
          text-transform: uppercase;
        }
        
        .mock-cv {
          padding: 20px;
          text-align: left;
        }
        .mock-header {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .mock-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-round);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--card-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 1rem;
        }
        .mock-header h4 {
          font-size: 1rem;
          color: var(--text-primary);
          font-weight: 600;
        }
        .mock-title {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .mock-divider {
          width: 100%;
          height: 1px;
          background: var(--card-border);
          margin: 14px 0;
        }
        .mock-body h5 {
          font-size: 0.65rem;
          color: var(--primary);
          margin-bottom: 6px;
          letter-spacing: 0.03em;
        }
        .mock-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .mock-tags span {
          font-size: 0.65rem;
          padding: 2px 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--card-border);
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .mock-experience {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .mock-experience p {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Features Section styling */
        .features-section, .steps-section {
          padding: 60px 0;
          text-align: center;
        }
        .section-intro {
          max-width: 500px;
          margin: 0 auto 40px;
        }
        .section-intro h2 {
          font-size: 1.8rem;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .feature-card {
          text-align: left;
          padding: 30px;
        }
        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 1px solid var(--card-border);
        }
        .feature-card h4 {
          font-size: 1.05rem;
          margin-bottom: 8px;
        }
        .feature-card p {
          font-size: 0.85rem;
          line-height: 1.5;
        }

        /* Step-by-Step section styling */
        .steps-flow {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .step-item {
          text-align: left;
          position: relative;
          padding: 30px;
        }
        .step-num {
          font-family: var(--font-heading);
          font-size: 2.8rem;
          font-weight: 700;
          color: var(--card-border);
          position: absolute;
          right: 20px;
          top: 10px;
          user-select: none;
        }
        .step-item h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          position: relative;
          z-index: 2;
        }
        .step-item p {
          font-size: 0.82rem;
          line-height: 1.5;
          position: relative;
          z-index: 2;
        }

        /* Final Banner styling */
        .cta-banner {
          padding: 40px 0 80px;
        }
        .cta-card {
          padding: 50px 30px !important;
          text-align: center;
        }
        .cta-card h3 {
          font-size: 1.6rem;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .cta-card p {
          font-size: 0.95rem;
          margin-bottom: 24px;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
        }
        .btn-lg {
          padding: 12px 24px;
          font-size: 1rem;
        }

        .landing-footer {
          text-align: center;
          padding: 30px 20px;
          border-top: 1px solid var(--card-border);
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
