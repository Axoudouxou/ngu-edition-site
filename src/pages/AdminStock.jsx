import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isAdminLoggedIn, adminFetchJson } from '@/lib/adminAuth';

export default function AdminStock() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [stock, setStock] = useState({}); // format_id -> { quantity, low_stock_threshold, book_title, format_label }
  const [saving, setSaving] = useState(null);
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login'); return; }
    Promise.all([
      adminFetchJson('/api/admin/books'),
      adminFetchJson('/api/admin/stock'),
    ]).then(([booksData, stockData]) => {
      setBooks(booksData);
      const map = {};
      stockData.forEach(s => { map[s.format_id] = s; });
      setStock(map);
    });
  }, [navigate]);

  const getEntry = (book, format) => stock[format.id] || {
    book_id: book.id, format_id: format.id, book_title: book.title,
    format_label: format.label, quantity: 0, low_stock_threshold: 5,
  };

  const updateQty = (formatId, field, value) => {
    setStock(prev => ({
      ...prev,
      [formatId]: { ...prev[formatId], [field]: value },
    }));
  };

  const handleSave = async (book, format) => {
    const entry = getEntry(book, format);
    setSaving(format.id);
    try {
      await adminFetchJson('/api/admin/stock', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      setSavedKey(format.id);
      setTimeout(() => setSavedKey(''), 2000);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      <h1 className="font-serif text-3xl font-semibold text-primary mb-8">Stock</h1>

      <div className="space-y-8">
        {books.map((book) => (
          <div key={book.id}>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-3">{book.title}</h2>
            <div className="bg-white border border-border/50 rounded-xl divide-y divide-border/30">
              {(book.formats || []).map((format) => {
                const entry = getEntry(book, format);
                const isLow = Number(entry.quantity) <= Number(entry.low_stock_threshold);
                return (
                  <div key={format.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{format.label}</p>
                      {isLow && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Stock bas
                        </p>
                      )}
                    </div>
                    <div className="w-28">
                      <label className="text-xs text-muted-foreground block mb-1">Quantité</label>
                      <Input
                        type="number"
                        value={entry.quantity}
                        onChange={(e) => updateQty(format.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs text-muted-foreground block mb-1">Seuil alerte</label>
                      <Input
                        type="number"
                        value={entry.low_stock_threshold}
                        onChange={(e) => updateQty(format.id, 'low_stock_threshold', Number(e.target.value))}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(book, format)}
                      disabled={saving === format.id}
                      className="bg-accent hover:bg-accent/90 text-white gap-2 rounded-full mt-5"
                    >
                      {saving === format.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                    {savedKey === format.id && <CheckCircle className="w-4 h-4 text-green-600 mt-5" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {books.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Aucun livre pour l'instant.</p>
        )}
      </div>
    </div>
  );
}
