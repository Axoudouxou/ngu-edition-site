import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Trash2, Plus, Loader2, CheckCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAdminLoggedIn, adminFetchJson, adminFetch } from '@/lib/adminAuth';

const EMPTY_BOOK = {
  id: '', title: '', author: '', tagline: '', description: '',
  coverSrc: '', amazonUrl: '', ebookPriceFCFA: 5000, physiquePriceFCFA: 7000,
  isEbook: true, points: [], testimonials: [], formats: [],
};

export default function AdminBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingEbook, setUploadingEbook] = useState(false);

  const load = () => adminFetchJson('/api/admin/books').then(setBooks).catch(() => {});

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login'); return; }
    load();
  }, [navigate]);

  const selectBook = (book) => setSelected({ ...book });
  const newBook = () => setSelected({ ...EMPTY_BOOK });

  const setField = (field, value) => setSelected(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!selected.id) { alert('L\'identifiant (slug) est obligatoire, ex: mon-nouveau-livre'); return; }
    setSaving(true);
    try {
      await adminFetchJson('/api/admin/books', {
        method: 'POST',
        body: JSON.stringify(selected),
      });
      setSavedMsg('Enregistré !');
      setTimeout(() => setSavedMsg(''), 2000);
      load();
    } catch (e) {
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce livre définitivement ?')) return;
    await adminFetch(`/api/admin/books/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected?.id) return;
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await adminFetch(`/api/admin/books/${selected.id}/upload-cover`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.cover_url) setField('coverSrc', data.cover_url);
    } catch (e) {
      alert('Erreur lors de l\'upload de la couverture.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleEbookUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected?.id) return;
    setUploadingEbook(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await adminFetch(`/api/admin/books/${selected.id}/upload-ebook`, {
        method: 'POST',
        body: formData,
      });
      alert('Fichier ebook envoyé avec succès.');
      load();
    } catch (e) {
      alert('Erreur lors de l\'upload du fichier.');
    } finally {
      setUploadingEbook(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">

        {/* Book list */}
        <div>
          <Button onClick={newBook} className="w-full mb-4 bg-primary hover:bg-primary/90 gap-2 rounded-full">
            <Plus className="w-4 h-4" /> Nouveau livre
          </Button>
          <div className="space-y-2">
            {books.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBook(b)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selected?.id === b.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <p className="font-medium text-sm text-foreground truncate">{b.title || '(sans titre)'}</p>
                <p className="text-xs text-muted-foreground">{b.id}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Edit form */}
        <div>
          {!selected ? (
            <div className="text-center text-muted-foreground py-24">
              Sélectionne un livre à gauche, ou crée-en un nouveau.
            </div>
          ) : (
            <div className="bg-white border border-border/50 rounded-2xl p-8 space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Identifiant (slug URL)</Label>
                  <Input
                    value={selected.id}
                    onChange={(e) => setField('id', e.target.value.trim())}
                    placeholder="mon-livre"
                    disabled={books.some(b => b.id === selected.id)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Auteur</Label>
                  <Input value={selected.author} onChange={(e) => setField('author', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Titre</Label>
                <Input value={selected.title} onChange={(e) => setField('title', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Accroche courte</Label>
                <Input value={selected.tagline} onChange={(e) => setField('tagline', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea
                  className="w-full min-h-[160px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={selected.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prix ebook (FCFA)</Label>
                  <Input type="number" value={selected.ebookPriceFCFA} onChange={(e) => setField('ebookPriceFCFA', Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prix physique (FCFA)</Label>
                  <Input type="number" value={selected.physiquePriceFCFA} onChange={(e) => setField('physiquePriceFCFA', Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Lien Amazon</Label>
                <Input value={selected.amazonUrl} onChange={(e) => setField('amazonUrl', e.target.value)} />
              </div>

              {/* Cover upload */}
              <div className="space-y-2">
                <Label>Couverture</Label>
                <div className="flex items-center gap-4">
                  {selected.coverSrc && (
                    <img src={selected.coverSrc} alt="couverture" className="w-16 h-24 object-cover rounded-md border" />
                  )}
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 text-sm text-muted-foreground">
                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {uploadingCover ? 'Envoi...' : 'Changer la couverture'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={!selected.id || uploadingCover} />
                  </label>
                </div>
                {!selected.id && <p className="text-xs text-amber-600">Enregistre le livre d'abord pour pouvoir uploader une couverture.</p>}
              </div>

              {/* Ebook file upload */}
              <div className="space-y-2">
                <Label>Fichier ebook (PDF ou EPUB)</Label>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 text-sm text-muted-foreground w-fit">
                  {uploadingEbook ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {uploadingEbook ? 'Envoi...' : (selected.hasEbookFile ? 'Remplacer le fichier' : 'Uploader le fichier')}
                  <input type="file" accept=".pdf,.epub" className="hidden" onChange={handleEbookUpload} disabled={!selected.id || uploadingEbook} />
                </label>
                {selected.hasEbookFile && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Fichier déjà en ligne</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-2 rounded-full px-6">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </Button>
                {savedMsg && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {savedMsg}</span>}
                {books.some(b => b.id === selected.id) && (
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="ml-auto inline-flex items-center gap-2 text-sm text-destructive/70 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer ce livre
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
