import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Accent colours for the live preview "theme" selector.
const THEMES = {
  terracotta: 'hsl(12,58%,50%)',
  slate: 'hsl(215,15%,40%)',
  forest: 'hsl(150,30%,35%)'
};

const yearOf = (d) => (d ? new Date(d).getFullYear() : '');
const range = (start, end) => `${yearOf(start)} — ${end ? yearOf(end) : 'Présent'}`;

const ICON = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  save: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
};

const FIELD = 'w-full px-3 py-2.5 text-[0.88rem] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[8px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-glow)] transition-colors';
const LABEL = 'block text-[0.82rem] font-semibold text-[var(--text-secondary)] mb-1.5';
const SECTION = 'text-[0.72rem] font-bold tracking-[0.05em] uppercase text-[var(--text-muted)] mb-3.5';

export default function ResumeBuilder({ resumeId, onBackToDashboard }) {
  const { id } = useParams();
  const activeResumeId = resumeId || id;
  const { user } = useAuth();

  // A new CV (no route id) is created on first interaction; createdId then holds it.
  const [createdId, setCreatedId] = useState(null);
  const effectiveId = activeResumeId || createdId;
  const isNew = !effectiveId;

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(Boolean(activeResumeId));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [activeTheme, setActiveTheme] = useState('terracotta');

  // General & contact fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [slug, setSlug] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [linkedin, setLinkedin] = useState('');
  // Preserved-but-not-edited contact fields (kept across updates).
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Experience / education inline-add forms
  const [expForm, setExpForm] = useState(null); // null = closed; {} = open
  const [eduForm, setEduForm] = useState(null);

  // Skills & languages catalog + new-name inputs
  const [allSkills, setAllSkills] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newLangName, setNewLangName] = useState('');

  const accent = THEMES[activeTheme];

  useEffect(() => {
    fetchGlobals();
    if (activeResumeId) fetchResume(activeResumeId);
    else seedFromUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResumeId]);

  const seedFromUser = () => {
    setFirstName(user?.name || user?.firstName || '');
    setLastName(user?.lastName || '');
    setProfessionalTitle(user?.title || '');
    setEmail(user?.email || '');
  };

  // silent = refresh lists/preview only, without resetting the general-tab fields
  // the user may have edited but not yet saved.
  const fetchResume = async (rid = effectiveId, silent = false) => {
    if (!rid) return;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const data = await api.resumes.get(rid);
      setResume(data);
      if (!silent) {
        setTitle(data.title || '');
        setSummary(data.summary || '');
        setSlug(data.portfolioSlug || '');
        setProfessionalTitle(user?.title || '');
        setFirstName(user?.name || user?.firstName || '');
        setLastName(user?.lastName || '');
        if (data.contact) {
          setPhone(data.contact.phone || '');
          setEmail(data.contact.email || user?.email || '');
          setCity(data.contact.city || '');
          setLinkedin(data.contact.linkedin || '');
          setAddress(data.contact.address || '');
          setPostalCode(data.contact.postalCode || '');
        } else {
          setEmail(user?.email || '');
        }
      }
    } catch (err) {
      if (!silent) setError(err.message || 'Impossible de charger le CV');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Create the draft CV (with current general + contact fields) the first time a
  // sub-resource is added, then reuse it. Returns the resume id to operate on.
  const ensureResume = async () => {
    if (effectiveId) return effectiveId;
    const visibility = slug ? 'PUBLIC' : 'PRIVATE';
    const base = { userId: user.id, title: title || 'Nouveau CV', summary, portfolioSlug: slug || undefined, visibility };
    const created = await api.resumes.create(base);
    let result = created;
    const contactPayload = { phone, email, city, linkedin, address, postalCode };
    if (Object.values(contactPayload).some(Boolean)) {
      const contact = await api.contacts.create(contactPayload);
      result = await api.resumes.update(created.id, { ...base, contactId: contact.id });
    }
    setCreatedId(created.id);
    setResume(result);
    if (!title) setTitle(result.title || 'Nouveau CV');
    // Reflect the new id in the address bar without remounting the editor.
    window.history.replaceState(null, '', `/builder/${created.id}`);
    return created.id;
  };

  const fetchGlobals = async () => {
    try {
      setAllSkills((await api.skills.list()) || []);
      setAllLanguages((await api.languages.list()) || []);
    } catch (e) {
      console.error('Failed to load skills/languages catalog', e);
    }
  };

  // Persist name + professional title to the candidate profile when changed.
  const syncProfile = async () => {
    const changed =
      firstName !== (user?.name || '') ||
      lastName !== (user?.lastName || '') ||
      professionalTitle !== (user?.title || '');
    if (!changed) return;
    try {
      await api.candidate.updateProfile({ name: firstName, lastName, title: professionalTitle });
    } catch {
      // Non-blocking: the CV still saves even if the profile update fails.
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await syncProfile();

      if (!effectiveId) {
        // First save of a brand-new CV (no sub-resource added yet).
        await ensureResume();
      } else {
        const contactPayload = { phone, email, city, linkedin, address, postalCode };
        const hasContact = Object.values(contactPayload).some(Boolean);
        const visibility = slug ? 'PUBLIC' : 'PRIVATE';
        let contactId = resume?.contact?.id;
        if (hasContact) {
          if (contactId) await api.contacts.update(contactId, contactPayload);
          else contactId = (await api.contacts.create(contactPayload)).id;
        }
        const updated = await api.resumes.update(effectiveId, {
          userId: resume?.userId || user.id, title, summary, portfolioSlug: slug || undefined,
          visibility, contactId, templateId: resume?.template?.id
        });
        setResume(updated);
      }
    } catch (err) {
      alert(err.message || "Impossible d'enregistrer les modifications");
    } finally {
      setSaving(false);
    }
  };

  // --- Experiences ---
  const submitExperience = async (e) => {
    e.preventDefault();
    try {
      const rid = await ensureResume();
      await api.experiences.create(rid, {
        position: expForm.position, company: expForm.company, description: expForm.description,
        startDate: expForm.startDate, endDate: expForm.endDate || null
      });
      setExpForm(null);
      fetchResume(rid, true);
    } catch (err) {
      alert(err.message || "Erreur lors de l'ajout de l'expérience");
    }
  };
  const deleteExperience = async (expId) => {
    if (!window.confirm('Supprimer cette expérience ?')) return;
    try { await api.experiences.delete(effectiveId, expId); fetchResume(effectiveId, true); }
    catch (err) { alert(err.message || 'Erreur lors de la suppression'); }
  };

  // --- Educations ---
  const submitEducation = async (e) => {
    e.preventDefault();
    try {
      const rid = await ensureResume();
      await api.educations.create(rid, {
        degree: eduForm.degree, institution: eduForm.institution, description: eduForm.description,
        startDate: eduForm.startDate, endDate: eduForm.endDate || null
      });
      setEduForm(null);
      fetchResume(rid, true);
    } catch (err) {
      alert(err.message || "Erreur lors de l'ajout de la formation");
    }
  };
  const deleteEducation = async (code) => {
    if (!window.confirm('Supprimer cette formation ?')) return;
    try { await api.educations.delete(effectiveId, code); fetchResume(effectiveId, true); }
    catch (err) { alert(err.message || 'Erreur lors de la suppression'); }
  };

  // --- Skills ---
  const linkSkill = async (skillId) => {
    try { const rid = await ensureResume(); await api.resumes.addSkill(rid, skillId); fetchResume(rid, true); }
    catch (err) { alert(err.message || "Erreur lors de l'ajout"); }
  };
  const createAndLinkSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      const rid = await ensureResume();
      const s = await api.skills.create(newSkillName.trim());
      await api.resumes.addSkill(rid, s.id);
      setNewSkillName(''); fetchGlobals(); fetchResume(rid, true);
    } catch (err) { alert(err.message || 'Erreur lors de la création de la compétence'); }
  };
  const unlinkSkill = async (skillId) => {
    try { await api.resumes.removeSkill(effectiveId, skillId); fetchResume(effectiveId, true); }
    catch (err) { alert(err.message || 'Erreur lors du retrait'); }
  };

  // --- Languages ---
  const linkLanguage = async (langId) => {
    try { const rid = await ensureResume(); await api.resumes.addLanguage(rid, langId); fetchResume(rid, true); }
    catch (err) { alert(err.message || "Erreur lors de l'ajout"); }
  };
  const createAndLinkLanguage = async (e) => {
    e.preventDefault();
    if (!newLangName.trim()) return;
    try {
      const rid = await ensureResume();
      const l = await api.languages.create(newLangName.trim());
      await api.resumes.addLanguage(rid, l.id);
      setNewLangName(''); fetchGlobals(); fetchResume(rid, true);
    } catch (err) { alert(err.message || 'Erreur lors de la création de la langue'); }
  };
  const unlinkLanguage = async (langId) => {
    try { await api.resumes.removeLanguage(effectiveId, langId); fetchResume(effectiveId, true); }
    catch (err) { alert(err.message || 'Erreur lors du retrait'); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--text-secondary)]">
        <span className="spinner large"></span>
        <p className="mt-3">Chargement du CV…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="alert alert-danger"><span>{error}</span></div>
        <button className="btn btn-secondary" onClick={onBackToDashboard}>Retour</button>
      </div>
    );
  }

  const skills = resume?.skills || [];
  const languages = resume?.languages || [];
  const experiences = resume?.experiences || [];
  const educations = resume?.educations || [];
  const linkedSkillIds = new Set(skills.map((s) => s.id));
  const linkedLangIds = new Set(languages.map((l) => l.id));
  const previewName = `${firstName} ${lastName}`.trim() || 'Votre Nom';

  const TABS = [
    { key: 'general', label: 'Général & Contact' },
    { key: 'experiences', label: 'Expériences' },
    { key: 'educations', label: 'Formations' },
    { key: 'tags', label: 'Compétences & Langues' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] max-[760px]:h-auto">

      {/* Topbar */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--card-border)] sticky top-0 z-30 flex-wrap">
        <div className="flex items-center gap-3.5 min-w-0">
          <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard}>
            <span className="w-[15px] h-[15px] inline-flex">{ICON.back}</span> Retour
          </button>
          <div className="min-w-0">
            <h1 className="text-[1.05rem] whitespace-nowrap overflow-hidden text-ellipsis">{title || 'CV sans titre'}</h1>
            <div className="text-[0.74rem] text-[var(--text-muted)]">{isNew ? 'Brouillon — non enregistré' : 'Enregistré'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.8rem] text-[var(--text-muted)] max-[980px]:hidden">Thème :</span>
            {Object.entries(THEMES).map(([key, color]) => (
              <button key={key} onClick={() => setActiveTheme(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.82rem] font-semibold rounded-full border cursor-pointer transition-colors ${
                  activeTheme === key
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-glow)]'
                    : 'border-[var(--card-border)] text-[var(--text-secondary)] bg-[var(--card-bg)]'
                }`}>
                <span className="w-3 h-3 rounded-full" style={{ background: color }}></span>
                {key === 'terracotta' ? 'Terracotta' : key === 'slate' ? 'Slate' : 'Forêt'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <span className="w-[15px] h-[15px] inline-flex">{ICON.save}</span>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </header>

      {/* Builder: editor + preview */}
      <div className="grid grid-cols-[460px_1fr] flex-1 min-h-0 max-[980px]:grid-cols-1 max-[980px]:flex-none">

        {/* EDITOR */}
        <div className="border-r border-[var(--card-border)] bg-[var(--bg-secondary)] overflow-y-auto flex flex-col max-[980px]:border-r-0 max-[980px]:border-b">
          <div className="flex gap-0.5 px-4 pt-3 sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--card-border)] z-[5] overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2.5 text-[0.83rem] font-semibold cursor-pointer border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? 'text-[var(--primary)] border-[var(--primary)]'
                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-[22px]">
            {/* GENERAL */}
            {activeTab === 'general' && (
              <form onSubmit={handleSave}>
                <h2 className={SECTION}>Informations du document</h2>
                <div className="mb-3.5">
                  <label className={LABEL}>Titre du CV</label>
                  <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="CV Développeur Fullstack" required />
                </div>
                <div className="mb-3.5">
                  <label className={LABEL}>Lien public (slug)</label>
                  <div className="flex items-center">
                    <span className="text-[0.84rem] text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-r-0 border-[var(--card-border)] px-2.5 py-2.5 rounded-l-[8px]">hireme.io/cv/</span>
                    <input className={`${FIELD} !rounded-l-none`} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="jean-dupont-dev" />
                  </div>
                  <div className="text-[0.74rem] text-[var(--text-muted)] mt-1.5">Laissez vide pour garder ce CV privé.</div>
                </div>
                <div className="mb-3.5">
                  <label className={LABEL}>Titre professionnel</label>
                  <input className={FIELD} value={professionalTitle} onChange={(e) => setProfessionalTitle(e.target.value)} placeholder="Développeur Fullstack React / Spring" />
                </div>
                <div className="mb-3.5">
                  <label className={LABEL}>Résumé / accroche</label>
                  <textarea className={`${FIELD} min-h-[72px] resize-y`} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Présentez brièvement votre profil…" />
                </div>

                <h2 className={`${SECTION} mt-7`}>Coordonnées</h2>
                <div className="grid grid-cols-2 gap-3 mb-3.5">
                  <div><label className={LABEL}>Prénom</label><input className={FIELD} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                  <div><label className={LABEL}>Nom</label><input className={FIELD} value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3.5">
                  <div><label className={LABEL}>Téléphone</label><input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" /></div>
                  <div><label className={LABEL}>E-mail</label><input className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3.5">
                  <div><label className={LABEL}>Ville</label><input className={FIELD} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" /></div>
                  <div><label className={LABEL}>LinkedIn</label><input className={FIELD} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="in/jeandupont" /></div>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-2" disabled={saving}>
                  {saving ? 'Enregistrement…' : isNew ? 'Créer le CV' : 'Enregistrer les modifications'}
                </button>
              </form>
            )}

            {/* EXPERIENCES */}
            {activeTab === 'experiences' && (
              <>
                  <h2 className={SECTION}>Expériences professionnelles</h2>
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border border-[var(--card-border)] rounded-[8px] p-3.5 mb-3 bg-[var(--card-bg)]">
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <strong className="text-[0.9rem] text-[var(--text-primary)]">{exp.position}</strong>
                          <div className="text-[0.78rem] text-[var(--text-muted)]">{exp.company} · {range(exp.startDate, exp.endDate)}</div>
                        </div>
                        <button onClick={() => deleteExperience(exp.id)} title="Supprimer"
                          className="bg-transparent border-none cursor-pointer p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--danger)] inline-flex"><span className="w-[15px] h-[15px] inline-flex">{ICON.trash}</span></button>
                      </div>
                      {exp.description && <div className="text-[0.8rem] text-[var(--text-secondary)] mt-1.5">{exp.description}</div>}
                    </div>
                  ))}

                  {expForm ? (
                    <form onSubmit={submitExperience} className="border border-[var(--primary-glow)] rounded-[8px] p-3.5 mb-3 bg-[var(--card-bg)]">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div><label className={LABEL}>Poste</label><input className={FIELD} value={expForm.position || ''} onChange={(e) => setExpForm({ ...expForm, position: e.target.value })} required /></div>
                        <div><label className={LABEL}>Entreprise</label><input className={FIELD} value={expForm.company || ''} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} required /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div><label className={LABEL}>Début</label><input className={FIELD} type="date" value={expForm.startDate || ''} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} required /></div>
                        <div><label className={LABEL}>Fin (option.)</label><input className={FIELD} type="date" value={expForm.endDate || ''} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} /></div>
                      </div>
                      <div className="mb-3"><label className={LABEL}>Description</label><textarea className={`${FIELD} min-h-[60px] resize-y`} value={expForm.description || ''} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} /></div>
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpForm(null)}>Annuler</button>
                        <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setExpForm({})}
                      className="flex items-center justify-center gap-2 w-full p-[11px] border-[1.5px] border-dashed border-[var(--card-border)] rounded-[8px] bg-transparent cursor-pointer text-[0.85rem] font-semibold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] transition-colors">
                      <span className="w-4 h-4 inline-flex">{ICON.plus}</span> Ajouter une expérience
                    </button>
                  )}
                </>
            )}

            {/* EDUCATIONS */}
            {activeTab === 'educations' && (
              <>
                  <h2 className={SECTION}>Formations</h2>
                  {educations.map((edu) => (
                    <div key={edu.code} className="border border-[var(--card-border)] rounded-[8px] p-3.5 mb-3 bg-[var(--card-bg)]">
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <strong className="text-[0.9rem] text-[var(--text-primary)]">{edu.degree}</strong>
                          <div className="text-[0.78rem] text-[var(--text-muted)]">{edu.institution} · {range(edu.startDate, edu.endDate)}</div>
                        </div>
                        <button onClick={() => deleteEducation(edu.code)} title="Supprimer"
                          className="bg-transparent border-none cursor-pointer p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--danger)] inline-flex"><span className="w-[15px] h-[15px] inline-flex">{ICON.trash}</span></button>
                      </div>
                      {edu.description && <div className="text-[0.8rem] text-[var(--text-secondary)] mt-1.5">{edu.description}</div>}
                    </div>
                  ))}

                  {eduForm ? (
                    <form onSubmit={submitEducation} className="border border-[var(--primary-glow)] rounded-[8px] p-3.5 mb-3 bg-[var(--card-bg)]">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div><label className={LABEL}>Diplôme</label><input className={FIELD} value={eduForm.degree || ''} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} required /></div>
                        <div><label className={LABEL}>Établissement</label><input className={FIELD} value={eduForm.institution || ''} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} required /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div><label className={LABEL}>Début</label><input className={FIELD} type="date" value={eduForm.startDate || ''} onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })} required /></div>
                        <div><label className={LABEL}>Fin (option.)</label><input className={FIELD} type="date" value={eduForm.endDate || ''} onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })} /></div>
                      </div>
                      <div className="mb-3"><label className={LABEL}>Description</label><textarea className={`${FIELD} min-h-[60px] resize-y`} value={eduForm.description || ''} onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })} /></div>
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEduForm(null)}>Annuler</button>
                        <button type="submit" className="btn btn-primary btn-sm">Ajouter</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setEduForm({})}
                      className="flex items-center justify-center gap-2 w-full p-[11px] border-[1.5px] border-dashed border-[var(--card-border)] rounded-[8px] bg-transparent cursor-pointer text-[0.85rem] font-semibold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] transition-colors">
                      <span className="w-4 h-4 inline-flex">{ICON.plus}</span> Ajouter une formation
                    </button>
                  )}
                </>
            )}

            {/* SKILLS & LANGUAGES */}
            {activeTab === 'tags' && (
              <>
                  <h2 className={SECTION}>Compétences</h2>
                  <form onSubmit={createAndLinkSkill} className="flex gap-2 mb-3.5">
                    <input className={`${FIELD} flex-1`} placeholder="Ajouter une compétence…" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                    <button type="submit" className="btn btn-secondary btn-sm">Ajouter</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 && <span className="text-[0.82rem] text-[var(--text-muted)] italic">Aucune compétence liée.</span>}
                    {skills.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 text-[0.82rem] font-medium bg-[var(--primary-glow)] text-[var(--primary)] rounded-full">
                        {s.title}
                        <button onClick={() => unlinkSkill(s.id)} className="bg-transparent border-none cursor-pointer text-[var(--primary)] inline-flex opacity-70 hover:opacity-100 p-0"><span className="w-[13px] h-[13px] inline-flex">{ICON.close}</span></button>
                      </span>
                    ))}
                  </div>
                  {allSkills.filter((s) => !linkedSkillIds.has(s.id)).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {allSkills.filter((s) => !linkedSkillIds.has(s.id)).map((s) => (
                        <button key={s.id} onClick={() => linkSkill(s.id)}
                          className="px-2.5 py-1 text-[0.78rem] rounded-full bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">+ {s.title}</button>
                      ))}
                    </div>
                  )}

                  <h2 className={`${SECTION} mt-7`}>Langues</h2>
                  <form onSubmit={createAndLinkLanguage} className="flex gap-2 mb-3.5">
                    <input className={`${FIELD} flex-1`} placeholder="Ajouter une langue…" value={newLangName} onChange={(e) => setNewLangName(e.target.value)} />
                    <button type="submit" className="btn btn-secondary btn-sm">Ajouter</button>
                  </form>
                  {languages.length === 0 && <span className="text-[0.82rem] text-[var(--text-muted)] italic">Aucune langue liée.</span>}
                  {languages.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-[var(--card-border)] last:border-b-0">
                      <strong className="text-[0.86rem] text-[var(--text-primary)]">{l.title}</strong>
                      <button onClick={() => unlinkLanguage(l.id)} className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)] inline-flex"><span className="w-[15px] h-[15px] inline-flex">{ICON.trash}</span></button>
                    </div>
                  ))}
                  {allLanguages.filter((l) => !linkedLangIds.has(l.id)).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {allLanguages.filter((l) => !linkedLangIds.has(l.id)).map((l) => (
                        <button key={l.id} onClick={() => linkLanguage(l.id)}
                          className="px-2.5 py-1 text-[0.78rem] rounded-full bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">+ {l.title}</button>
                      ))}
                    </div>
                  )}
                </>
            )}
          </div>
        </div>

        {/* PREVIEW (A4) */}
        <div className="overflow-y-auto p-8 bg-[var(--bg-primary)] flex flex-col items-center max-[980px]:p-4">
          <div className="flex items-center justify-between w-full max-w-[620px] mb-[18px]">
            <span className="text-[0.8rem] text-[var(--text-muted)]">Aperçu en direct · A4</span>
          </div>

          <div className="w-full max-w-[620px] bg-white shadow-[var(--shadow-lg)] rounded-[4px] px-[46px] py-[44px] text-[#2b2520] text-[12.5px] leading-[1.5]" style={{ '--acc': accent }}>
            <div className="text-[26px] font-bold tracking-[-0.01em] text-[#1c1814]">{previewName}</div>
            {(professionalTitle || title) && <div className="text-[14px] font-semibold mt-0.5" style={{ color: accent }}>{professionalTitle || title}</div>}
            <div className="flex flex-wrap gap-3.5 mt-3 text-[11px] text-[#6b6258]">
              {phone && <span>☏ {phone}</span>}
              {email && <span>✉ {email}</span>}
              {city && <span>⌖ {city}</span>}
              {linkedin && <span>in {linkedin}</span>}
            </div>
            <div className="h-0.5 w-[46px] my-[18px] rounded-[2px]" style={{ background: accent }}></div>

            {summary && (
              <div className="mb-5">
                <h3 className="text-[12px] font-bold tracking-[0.06em] uppercase mb-2.5" style={{ color: accent }}>Profil</h3>
                <div className="text-[12px] text-[#4a423a]">{summary}</div>
              </div>
            )}

            {experiences.length > 0 && (
              <div className="mb-5">
                <h3 className="text-[12px] font-bold tracking-[0.06em] uppercase mb-2.5" style={{ color: accent }}>Expériences</h3>
                {experiences.map((exp) => (
                  <div key={exp.id} className="mb-[13px]">
                    <div className="flex items-baseline justify-between gap-2.5">
                      <span className="font-bold text-[#1c1814] text-[12.5px]">{exp.position}</span>
                      <span className="text-[10.5px] text-[#8a8076] whitespace-nowrap">{range(exp.startDate, exp.endDate)}</span>
                    </div>
                    <div className="text-[11.5px] font-semibold" style={{ color: accent }}>{exp.company}</div>
                    {exp.description && <div className="text-[11px] text-[#5a5249] mt-[3px]">{exp.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {educations.length > 0 && (
              <div className="mb-5">
                <h3 className="text-[12px] font-bold tracking-[0.06em] uppercase mb-2.5" style={{ color: accent }}>Formations</h3>
                {educations.map((edu) => (
                  <div key={edu.code} className="mb-[13px]">
                    <div className="flex items-baseline justify-between gap-2.5">
                      <span className="font-bold text-[#1c1814] text-[12.5px]">{edu.degree}</span>
                      <span className="text-[10.5px] text-[#8a8076] whitespace-nowrap">{range(edu.startDate, edu.endDate)}</span>
                    </div>
                    <div className="text-[11.5px] font-semibold" style={{ color: accent }}>{edu.institution}</div>
                    {edu.description && <div className="text-[11px] text-[#5a5249] mt-[3px]">{edu.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {skills.length > 0 && (
              <div className="mb-5">
                <h3 className="text-[12px] font-bold tracking-[0.06em] uppercase mb-2.5" style={{ color: accent }}>Compétences</h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => <span key={s.id} className="text-[10.5px] px-[9px] py-[3px] bg-[#f3ede5] text-[#4a423a] rounded-full">{s.title}</span>)}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="mb-5">
                <h3 className="text-[12px] font-bold tracking-[0.06em] uppercase mb-2.5" style={{ color: accent }}>Langues</h3>
                <div className="flex flex-col gap-1.5">
                  {languages.map((l) => <div key={l.id} className="text-[11.5px] font-semibold text-[#2b2520]">{l.title}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
