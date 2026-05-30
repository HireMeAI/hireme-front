import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ResumeBuilder({ resumeId, onBackToDashboard }) {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // general, experiences, educations, tags
  
  // Style template selected (local custom CSS classes)
  const [activeTheme, setActiveTheme] = useState('indigo-modern'); // indigo-modern, minimalist-slate, ivory-executive

  // Form states: General & Contact
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [slug, setSlug] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [linkedin, setLinkedin] = useState('');
  
  // Form states: New Experience
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [isNewExpOpen, setIsNewExpOpen] = useState(false);

  // Form states: New Education
  const [eduDegree, setEduDegree] = useState('');
  const [eduInst, setEduInst] = useState('');
  const [eduDesc, setEduDesc] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');
  const [isNewEduOpen, setIsNewEduOpen] = useState(false);

  // Form states: Skills & Languages linking
  const [allSkills, setAllSkills] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newLangName, setNewLangName] = useState('');

  const [savingGeneral, setSavingGeneral] = useState(false);

  useEffect(() => {
    fetchResume();
    fetchGlobals();
  }, [resumeId]);

  const fetchResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.resumes.get(resumeId);
      setResume(data);
      
      // Populate fields
      setTitle(data.title || '');
      setSummary(data.summary || '');
      setSlug(data.portfolioSlug || '');
      setVisibility(data.visibility || 'PUBLIC');
      
      if (data.contact) {
        setPhone(data.contact.phone || '');
        setEmail(data.contact.email || '');
        setAddress(data.contact.address || '');
        setCity(data.contact.city || '');
        setPostalCode(data.contact.postalCode || '');
        setLinkedin(data.contact.linkedin || '');
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger le CV');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobals = async () => {
    try {
      const skills = await api.skills.list();
      setAllSkills(skills || []);
      const langs = await api.languages.list();
      setAllLanguages(langs || []);
    } catch (e) {
      console.error("Failed to load skills/languages catalog", e);
    }
  };

  // General & Contact details saving
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      let contactId = resume.contact?.id;

      // Handle Contact creation or updating
      const contactPayload = { phone, email, address, city, postalCode, linkedin };
      if (!contactId) {
        // If resume has no contact object, create one in DB
        const newContact = await api.contacts.create(contactPayload);
        contactId = newContact.id;
      } else {
        // Otherwise, update existing contact
        await api.contacts.update(contactId, contactPayload);
      }

      // Update core Resume details
      const updatedResume = await api.resumes.update(resumeId, {
        userId: resume.userId,
        title,
        summary,
        portfolioSlug: slug || undefined,
        visibility,
        contactId,
        templateId: resume.template?.id // Keep existing template ID if present
      });

      setResume(updatedResume);
      alert('Informations générales enregistrées avec succès !');
    } catch (err) {
      alert(err.message || 'Impossible d\'enregistrer les modifications');
    } finally {
      setSavingGeneral(false);
    }
  };

  // Experience actions
  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      await api.experiences.create(resumeId, {
        position: expTitle,
        company: expCompany,
        description: expDesc,
        startDate: expStart,
        endDate: expEnd || null
      });
      // Clear experience fields
      setExpTitle('');
      setExpCompany('');
      setExpDesc('');
      setExpStart('');
      setExpEnd('');
      setIsNewExpOpen(false);
      
      // Reload resume content
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout de l\'expérience');
    }
  };

  const handleDeleteExperience = async (expId) => {
    if (!window.confirm('Supprimer cette expérience ?')) return;
    try {
      await api.experiences.delete(resumeId, expId);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  // Education actions
  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
      await api.educations.create(resumeId, {
        degree: eduDegree,
        institution: eduInst,
        description: eduDesc,
        startDate: eduStart,
        endDate: eduEnd || null
      });
      setEduDegree('');
      setEduInst('');
      setEduDesc('');
      setEduStart('');
      setEduEnd('');
      setIsNewEduOpen(false);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout de la formation');
    }
  };

  const handleDeleteEducation = async (eduCode) => {
    if (!window.confirm('Supprimer cette formation ?')) return;
    try {
      await api.educations.delete(resumeId, eduCode);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  // Skills actions
  const handleLinkSkill = async (skillId) => {
    try {
      await api.resumes.addSkill(resumeId, skillId);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleCreateAndLinkSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      const newSkill = await api.skills.create(newSkillName.trim(), 'ADVANCED');
      await api.resumes.addSkill(resumeId, newSkill.id);
      setNewSkillName('');
      fetchGlobals();
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création de la compétence');
    }
  };

  const handleUnlinkSkill = async (skillId) => {
    try {
      await api.resumes.removeSkill(resumeId, skillId);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors du retrait');
    }
  };

  // Languages actions
  const handleLinkLanguage = async (langId) => {
    try {
      await api.resumes.addLanguage(resumeId, langId);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleCreateAndLinkLanguage = async (e) => {
    e.preventDefault();
    if (!newLangName.trim()) return;
    try {
      const newLang = await api.languages.create(newLangName.trim(), 'BILINGUAL');
      await api.resumes.addLanguage(resumeId, newLang.id);
      setNewLangName('');
      fetchGlobals();
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création de la langue');
    }
  };

  const handleUnlinkLanguage = async (langId) => {
    try {
      await api.resumes.removeLanguage(resumeId, langId);
      fetchResume();
    } catch (err) {
      alert(err.message || 'Erreur lors du retrait');
    }
  };

  if (loading) {
    return (
      <div className="builder-loading-view fade-in container">
        <span className="spinner large"></span>
        <p>Chargement du CV intelligent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="builder-loading-view fade-in container">
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
        <button className="btn btn-secondary" onClick={onBackToDashboard}>Retour</button>
      </div>
    );
  }

  const linkedSkillIds = new Set(resume.skills?.map(s => s.id) || []);
  const linkedLangIds = new Set(resume.languages?.map(l => l.id) || []);

  return (
    <div className="builder-view fade-in container">
      
      {/* Upper Navigation bar inside editor */}
      <div className="builder-navbar">
        <div className="builder-nav-left">
          <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard}>
            ← Retour
          </button>
          <h2>Éditeur intelligent: {title || 'CV sans titre'}</h2>
        </div>
        
        {/* Template theme selector tabs */}
        <div className="template-selector">
          <span className="tmpl-label text-sm text-muted">Thème de rendu :</span>
          <button 
            className={`btn btn-secondary btn-sm ${activeTheme === 'indigo-modern' ? 'active' : ''}`}
            onClick={() => setActiveTheme('indigo-modern')}
          >
            Indigo Moderne
          </button>
          <button 
            className={`btn btn-secondary btn-sm ${activeTheme === 'minimalist-slate' ? 'active' : ''}`}
            onClick={() => setActiveTheme('minimalist-slate')}
          >
            Slate Minimal
          </button>
          <button 
            className={`btn btn-secondary btn-sm ${activeTheme === 'ivory-executive' ? 'active' : ''}`}
            onClick={() => setActiveTheme('ivory-executive')}
          >
            Executive Ivory
          </button>
        </div>
      </div>

      <div className="builder-main-layout">
        
        {/* LEFT COLUMN: The Interactive Form Editors */}
        <div className="builder-editor-column">
          <div className="card editor-card">
            
            {/* Editor tab selectors */}
            <div className="editor-tabs">
              <button 
                className={`editor-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                Général & Contact
              </button>
              <button 
                className={`editor-tab-btn ${activeTab === 'experiences' ? 'active' : ''}`}
                onClick={() => setActiveTab('experiences')}
              >
                Expériences
              </button>
              <button 
                className={`editor-tab-btn ${activeTab === 'educations' ? 'active' : ''}`}
                onClick={() => setActiveTab('educations')}
              >
                Formations
              </button>
              <button 
                className={`editor-tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
                onClick={() => setActiveTab('tags')}
              >
                Compétences & Langues
              </button>
            </div>

            <div className="tab-content-block">
              {activeTab === 'general' && (
                /* TAB 1: General and Contact Details Form */
                <form onSubmit={handleSaveGeneral} className="fade-in">
                  <h3 className="section-title">Informations du document</h3>
                  <div className="form-group">
                    <label className="form-label">Titre du document</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Slug de portfolio public</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={slug} 
                        onChange={(e) => setSlug(e.target.value)} 
                        placeholder="Ex: jean-dupont-dev" 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Visibilité</label>
                      <select 
                        className="form-control"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                      >
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="PRIVATE">PRIVATE</option>
                        <option value="UNLISTED">UNLISTED</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Résumé professionnel</label>
                    <textarea 
                      className="form-control" 
                      value={summary} 
                      onChange={(e) => setSummary(e.target.value)} 
                      rows="4" 
                      placeholder="Présentez brièvement vos compétences clés..."
                    />
                  </div>

                  <h3 className="section-title" style={{marginTop: '30px'}}>Coordonnées de contact</h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Téléphone</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="Ex: 06 12 34 56 78" 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-mail de contact</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Ex: jean@mail.com" 
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Adresse</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Ex: 12 Rue de Paris" 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ville</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        placeholder="Ex: Lyon" 
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Code Postal</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={postalCode} 
                        onChange={(e) => setPostalCode(e.target.value)} 
                        placeholder="Ex: 69000" 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lien LinkedIn</label>
                      <input 
                        type="url" 
                        className="form-control" 
                        value={linkedin} 
                        onChange={(e) => setLinkedin(e.target.value)} 
                        placeholder="Ex: https://linkedin.com/in/..." 
                      />
                    </div>
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn btn-primary" disabled={savingGeneral}>
                      {savingGeneral ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'experiences' && (
                /* TAB 2: Experiences List & Creation Form */
                <div className="fade-in">
                  <div className="tab-section-header">
                    <h3>Expériences Professionnelles</h3>
                    {!isNewExpOpen && (
                      <button className="btn btn-primary btn-sm" onClick={() => setIsNewExpOpen(true)}>
                        + Ajouter une expérience
                      </button>
                    )}
                  </div>

                  {isNewExpOpen && (
                    <form onSubmit={handleAddExperience} className="card add-item-form-card scale-in">
                      <h4>Nouvelle expérience</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Poste occupé</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Développeur React Senior" 
                            value={expTitle}
                            onChange={(e) => setExpTitle(e.target.value)}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Entreprise</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Google" 
                            value={expCompany}
                            onChange={(e) => setExpCompany(e.target.value)}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Date de début</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={expStart}
                            onChange={(e) => setExpStart(e.target.value)}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date de fin (Optionnel)</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={expEnd}
                            onChange={(e) => setExpEnd(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description des réalisations</label>
                        <textarea 
                          className="form-control" 
                          placeholder="Décrivez vos missions et accomplissements..." 
                          value={expDesc}
                          onChange={(e) => setExpDesc(e.target.value)}
                          rows="3" 
                        />
                      </div>

                      <div className="form-actions-row">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsNewExpOpen(false)}>
                          Annuler
                        </button>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Ajouter l'expérience
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of active experiences */}
                  <div className="items-list">
                    {(resume.experiences || []).length === 0 ? (
                      <p className="no-items-text">Aucune expérience professionnelle renseignée.</p>
                    ) : (
                      resume.experiences.map((exp) => (
                        <div key={exp.id} className="card item-list-card fade-in">
                          <div className="item-header">
                            <div>
                              <h4>{exp.position}</h4>
                              <span className="text-secondary">{exp.company}</span>
                              <p className="text-muted text-sm">
                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}) : ''} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}) : 'Présent'}
                              </p>
                            </div>
                            <button className="btn-icon" onClick={() => handleDeleteExperience(exp.id)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                          {exp.description && <p className="item-desc">{exp.description}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'educations' && (
                /* TAB 3: Educations List & Creation Form */
                <div className="fade-in">
                  <div className="tab-section-header">
                    <h3>Formations et Diplômes</h3>
                    {!isNewEduOpen && (
                      <button className="btn btn-primary btn-sm" onClick={() => setIsNewEduOpen(true)}>
                        + Ajouter une formation
                      </button>
                    )}
                  </div>

                  {isNewEduOpen && (
                    <form onSubmit={handleAddEducation} className="card add-item-form-card scale-in">
                      <h4>Nouvelle formation</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Diplôme / Titre</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Master 2 Informatique" 
                            value={eduDegree}
                            onChange={(e) => setEduDegree(e.target.value)}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Établissement / École</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Université Lyon 1" 
                            value={eduInst}
                            onChange={(e) => setEduInst(e.target.value)}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Date de début</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={eduStart}
                            onChange={(e) => setEduStart(e.target.value)}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date d'obtention (Optionnel)</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={eduEnd}
                            onChange={(e) => setEduEnd(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description (Optionnel)</label>
                        <textarea 
                          className="form-control" 
                          placeholder="Matières clés, projets académiques, mentions..." 
                          value={eduDesc}
                          onChange={(e) => setEduDesc(e.target.value)}
                          rows="3" 
                        />
                      </div>

                      <div className="form-actions-row">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsNewEduOpen(false)}>
                          Annuler
                        </button>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Ajouter la formation
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of active educations */}
                  <div className="items-list">
                    {(resume.educations || []).length === 0 ? (
                      <p className="no-items-text">Aucune formation renseignée.</p>
                    ) : (
                      resume.educations.map((edu) => (
                        <div key={edu.code} className="card item-list-card fade-in">
                          <div className="item-header">
                            <div>
                              <h4>{edu.degree}</h4>
                              <span className="text-secondary">{edu.institution}</span>
                              <p className="text-muted text-sm">
                                {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Présent'}
                              </p>
                            </div>
                            <button className="btn-icon" onClick={() => handleDeleteEducation(edu.code)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                          {edu.description && <p className="item-desc">{edu.description}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'tags' && (
                /* TAB 4: Skills and Languages Linkers */
                <div className="fade-in">
                  
                  {/* Skills Section */}
                  <div className="tag-group-block">
                    <h3>Compétences professionnelles</h3>
                    
                    {/* Active skill tags inside resume */}
                    <div className="active-tags-row">
                      {resume.skills?.length === 0 && <span className="no-items-text text-sm">Aucune compétence liée.</span>}
                      {resume.skills?.map(s => (
                        <span key={s.id} className="badge badge-primary interactive-tag">
                          {s.title}
                          <button className="unlink-btn" onClick={() => handleUnlinkSkill(s.id)}>×</button>
                        </span>
                      ))}
                    </div>

                    <div className="divider"></div>

                    {/* Catalog Linkers or Create New Form */}
                    <form onSubmit={handleCreateAndLinkSkill} className="tag-adder-form">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Créer une compétence (ex: React.js)" 
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
                    </form>

                    <div className="global-tags-selector">
                      <span className="text-sm text-muted">Suggérées depuis le catalogue :</span>
                      <div className="catalog-tags">
                        {allSkills
                          .filter(s => !linkedSkillIds.has(s.id))
                          .map(s => (
                            <button key={s.id} className="catalog-tag-btn" onClick={() => handleLinkSkill(s.id)}>
                              + {s.title}
                            </button>
                          ))}
                        {allSkills.filter(s => !linkedSkillIds.has(s.id)).length === 0 && (
                          <span className="text-sm text-muted italic">Catalogue vide ou entièrement lié</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="divider" style={{margin: '30px 0'}}></div>

                  {/* Languages Section */}
                  <div className="tag-group-block">
                    <h3>Langues étrangères</h3>
                    
                    {/* Active language tags inside resume */}
                    <div className="active-tags-row">
                      {resume.languages?.length === 0 && <span className="no-items-text text-sm">Aucune langue liée.</span>}
                      {resume.languages?.map(l => (
                        <span key={l.id} className="badge badge-secondary interactive-tag">
                          {l.title}
                          <button className="unlink-btn" onClick={() => handleUnlinkLanguage(l.id)}>×</button>
                        </span>
                      ))}
                    </div>

                    <div className="divider"></div>

                    <form onSubmit={handleCreateAndLinkLanguage} className="tag-adder-form">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Créer une langue (ex: Anglais)" 
                        value={newLangName}
                        onChange={(e) => setNewLangName(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
                    </form>

                    <div className="global-tags-selector">
                      <span className="text-sm text-muted">Suggérées depuis le catalogue :</span>
                      <div className="catalog-tags">
                        {allLanguages
                          .filter(l => !linkedLangIds.has(l.id))
                          .map(l => (
                            <button key={l.id} className="catalog-tag-btn" onClick={() => handleLinkLanguage(l.id)}>
                              + {l.title}
                            </button>
                          ))}
                        {allLanguages.filter(l => !linkedLangIds.has(l.id)).length === 0 && (
                          <span className="text-sm text-muted italic">Catalogue vide ou entièrement lié</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: The Visual Premium CV Live Preview */}
        <div className="builder-preview-column">
          <div className="preview-container">
            <span className="preview-indicator">Aperçu en temps réel</span>
            
            {/* The actual virtual paper sheet rendering */}
            <div className={`cv-sheet ${activeTheme} fade-in`}>
              
              <div className="cv-header">
                <div>
                  <h1 className="cv-fullname">
                    {user ? (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'VOTRE NOM COMPLET') : 'VOTRE NOM COMPLET'}
                  </h1>
                  <h2 className="cv-jobtitle">{title || 'VOTRE TITRE PROFESSIONNEL'}</h2>
                </div>
                
                {/* Contact Coordinates block */}
                <div className="cv-contact-coords">
                  {email && <span className="cv-coord-item">✉ {email}</span>}
                  {phone && <span className="cv-coord-item">☏ {phone}</span>}
                  {city && <span className="cv-coord-item">⌖ {city} {postalCode}</span>}
                  {linkedin && <span className="cv-coord-item">🔗 LinkedIn</span>}
                </div>
              </div>

              {/* Accroche / Summary Block */}
              {summary && (
                <div className="cv-section">
                  <h3 className="cv-section-title">PROFIL</h3>
                  <p className="cv-summary-text">{summary}</p>
                </div>
              )}

              {/* Experiences Timeline */}
              {(resume.experiences || []).length > 0 && (
                <div className="cv-section">
                  <h3 className="cv-section-title">EXPÉRIENCE PROFESSIONNELLE</h3>
                  <div className="cv-timeline">
                    {resume.experiences.map((exp) => (
                      <div key={exp.id} className="cv-timeline-item">
                        <div className="cv-item-meta">
                          <strong>{exp.position}</strong>
                          <span>{exp.company}</span>
                          <span className="cv-item-dates">
                            {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Présent'}
                          </span>
                        </div>
                        {exp.description && <p className="cv-item-desc">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Educations Timeline */}
              {(resume.educations || []).length > 0 && (
                <div className="cv-section">
                  <h3 className="cv-section-title">FORMATION</h3>
                  <div className="cv-timeline">
                    {resume.educations.map((edu) => (
                      <div key={edu.code} className="cv-timeline-item">
                        <div className="cv-item-meta">
                          <strong>{edu.degree}</strong>
                          <span>{edu.institution}</span>
                          <span className="cv-item-dates">
                            {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - {edu.endDate ? new Date(edu.endDate).getFullYear() : ''}
                          </span>
                        </div>
                        {edu.description && <p className="cv-item-desc">{edu.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Tags row inside paper */}
              {(resume.skills || []).length > 0 && (
                <div className="cv-section">
                  <h3 className="cv-section-title">COMPÉTENCES</h3>
                  <div className="cv-tags-row">
                    {resume.skills.map(s => (
                      <span key={s.id} className="cv-tag">{s.title}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages Tags row inside paper */}
              {(resume.languages || []).length > 0 && (
                <div className="cv-section">
                  <h3 className="cv-section-title">LANGUES</h3>
                  <div className="cv-tags-row">
                    {resume.languages.map(l => (
                      <span key={l.id} className="cv-tag-outline">{l.title}</span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      <style>{`
        .builder-loading-view {
          text-align: center;
          padding: 80px 0;
          color: var(--text-secondary);
        }
        .builder-view {
          padding-top: 10px;
          padding-bottom: 60px;
          text-align: left;
        }
        .builder-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .builder-nav-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .builder-nav-left h2 {
          font-size: 1.5rem;
        }
        .template-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .template-selector .active {
          border-color: var(--primary);
          box-shadow: 0 0 8px var(--primary-glow);
          color: var(--primary);
        }
        .builder-main-layout {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 30px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .builder-main-layout {
            grid-template-columns: 1fr;
          }
        }
        .editor-tabs {
          display: flex;
          border-bottom: 1px solid var(--card-border);
          margin-bottom: 24px;
          overflow-x: auto;
        }
        .editor-tab-btn {
          background: none;
          border: none;
          padding: 12px 18px;
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: var(--transition-fast);
          white-space: nowrap;
        }
        .editor-tab-btn:hover {
          color: var(--text-primary);
        }
        .editor-tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .section-title {
          font-size: 1.1rem;
          margin-bottom: 16px;
          border-left: 3px solid var(--primary);
          padding-left: 10px;
        }
        .form-actions-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
          gap: 12px;
        }
        .tab-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .add-item-form-card {
          margin-bottom: 24px;
          padding: 20px !important;
          border-color: var(--primary-glow) !important;
          background: var(--bg-secondary);
        }
        .add-item-form-card h4 {
          margin-bottom: 16px;
        }
        .items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .no-items-text {
          color: var(--text-muted);
          font-style: italic;
        }
        .item-list-card {
          padding: 16px 20px !important;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .item-header h4 {
          font-size: 1.05rem;
        }
        .item-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 8px;
          border-left: 2px solid var(--card-border);
          padding-left: 10px;
        }
        
        /* Skills & Languages linkers styling */
        .tag-group-block h3 {
          font-size: 1.15rem;
          margin-bottom: 16px;
        }
        .active-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .interactive-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
        }
        .unlink-btn {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 0.5;
          opacity: 0.7;
          transition: var(--transition-fast);
        }
        .unlink-btn:hover {
          opacity: 1;
        }
        .tag-adder-form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .global-tags-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .catalog-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .catalog-tag-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--card-border);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .catalog-tag-btn:hover {
          background: var(--primary-glow);
          color: var(--text-primary);
          border-color: var(--primary);
        }

        /* RIGHT COLUMN: Real-Time Sheet previewer styling */
        .preview-container {
          position: sticky;
          top: 100px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .preview-indicator {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
          text-align: center;
        }
        
        /* The virtual A4 sheet rules */
        .cv-sheet {
          background: white;
          color: #334155;
          padding: 40px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg), 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          aspect-ratio: 1 / 1.414;
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
          transition: var(--transition);
        }

        /* --- Theme definitions inside paper sheet --- */
        .cv-sheet.indigo-modern {
          border-top: 8px solid hsl(255, 85%, 62%);
        }
        .cv-sheet.indigo-modern .cv-jobtitle {
          color: hsl(255, 85%, 62%);
        }
        .cv-sheet.indigo-modern .cv-section-title {
          border-bottom: 2px solid hsl(255, 85%, 62%);
          color: hsl(255, 85%, 50%);
        }
        .cv-sheet.indigo-modern .cv-tag {
          background: hsla(255, 85%, 62%, 0.1);
          color: hsl(255, 85%, 50%);
          border-radius: 4px;
        }

        .cv-sheet.minimalist-slate {
          border-top: 8px solid #475569;
        }
        .cv-sheet.minimalist-slate .cv-fullname {
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .cv-sheet.minimalist-slate .cv-jobtitle {
          color: #64748b;
          text-transform: uppercase;
          font-size: 1.1rem;
        }
        .cv-sheet.minimalist-slate .cv-section-title {
          border-bottom: 1px solid #cbd5e1;
          color: #334155;
          letter-spacing: 0.05em;
        }
        .cv-sheet.minimalist-slate .cv-tag {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
        }

        .cv-sheet.ivory-executive {
          background: #fafaf9;
          border-top: 8px solid #854d0e;
        }
        .cv-sheet.ivory-executive .cv-header {
          border-bottom: 1px solid #e7e5e4;
          padding-bottom: 20px;
        }
        .cv-sheet.ivory-executive .cv-jobtitle {
          color: #854d0e;
          font-style: italic;
          font-family: serif;
        }
        .cv-sheet.ivory-executive .cv-section-title {
          border-bottom: 1px double #d6d3d1;
          color: #78350f;
          font-family: serif;
        }
        .cv-sheet.ivory-executive .cv-tag {
          background: #fef08a;
          color: #713f12;
          border-radius: 2px;
        }

        /* Internal virtual paper coordinates styling */
        .cv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          text-align: left;
        }
        .cv-fullname {
          font-size: 1.6rem;
          line-height: 1.2;
          background: none;
          color: #0f172a;
          -webkit-text-fill-color: initial;
          margin-bottom: 4px;
          font-weight: 800;
        }
        .cv-jobtitle {
          font-size: 1.05rem;
          font-weight: 600;
        }
        .cv-contact-coords {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: right;
          font-size: 0.75rem;
          color: #64748b;
        }
        .cv-section {
          margin-bottom: 20px;
          text-align: left;
        }
        .cv-section-title {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding-bottom: 4px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .cv-summary-text {
          font-size: 0.8rem;
          color: #475569;
          line-height: 1.5;
        }
        .cv-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cv-timeline-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cv-item-meta {
          display: flex;
          font-size: 0.8rem;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .cv-item-meta strong {
          color: #0f172a;
        }
        .cv-item-meta span {
          color: #64748b;
        }
        .cv-item-dates {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .cv-item-desc {
          font-size: 0.75rem;
          color: #475569;
          line-height: 1.4;
        }
        .cv-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cv-tag {
          font-size: 0.75rem;
          padding: 4px 10px;
          font-weight: 600;
        }
        .cv-tag-outline {
          font-size: 0.75rem;
          padding: 3px 9px;
          font-weight: 600;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
