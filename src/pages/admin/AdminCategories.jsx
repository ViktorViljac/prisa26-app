import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SavingsIcon from '@mui/icons-material/Savings';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WorkIcon from '@mui/icons-material/Work';
import CodeIcon from '@mui/icons-material/Code';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BrushIcon from '@mui/icons-material/Brush';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const ICON_MAP = {
  FavoriteIcon: FavoriteIcon,
  FitnessCenterIcon: FitnessCenterIcon,
  SavingsIcon: SavingsIcon,
  SchoolIcon: SchoolIcon,
  GroupsIcon: GroupsIcon,
  SelfImprovementIcon: SelfImprovementIcon,
  AutoStoriesIcon: AutoStoriesIcon,
  RestaurantIcon: RestaurantIcon,
  WorkIcon: WorkIcon,
  CodeIcon: CodeIcon,
  SportsEsportsIcon: SportsEsportsIcon,
  BrushIcon: BrushIcon,
  TravelExploreIcon: TravelExploreIcon,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    icon: 'FavoriteIcon',
    gradient_start: '#f07147',
    gradient_end: '#ff9f43',
    sort_order: 0,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenge_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) {
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'sort_order' ? parseInt(value) || 0 : value,
    }));
  };

  const handleEditClick = (cat) => {
    setEditingCategory(cat);
    setIsAdding(false);
    setForm({
      name: cat.name || '',
      icon: cat.icon || 'FavoriteIcon',
      gradient_start: cat.gradient_start || '#f07147',
      gradient_end: cat.gradient_end || '#ff9f43',
      sort_order: cat.sort_order || 0,
    });
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsAdding(true);
    setForm({
      name: '',
      icon: 'FavoriteIcon',
      gradient_start: '#f07147',
      gradient_end: '#ff9f43',
      sort_order: categories.length + 1,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('challenge_categories')
          .update({
            name: form.name,
            icon: form.icon,
            gradient_start: form.gradient_start,
            gradient_end: form.gradient_end,
            sort_order: form.sort_order,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        setEditingCategory(null);
      } else {
        // Create
        const { error } = await supabase
          .from('challenge_categories')
          .insert([
            {
              name: form.name,
              icon: form.icon,
              gradient_start: form.gradient_start,
              gradient_end: form.gradient_end,
              sort_order: form.sort_order,
            },
          ]);

        if (error) throw error;
        setIsAdding(false);
      }

      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja kategorije.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Jesi li siguran da želiš obrisati kategoriju "${name}"? Svi povezani izazovi mogli bi prestati raditi.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('challenge_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Greška pri brisanju. Moguće je da postoje izazovi u ovoj kategoriji.');
    }
  };

  const renderIcon = (iconName) => {
    const IconComponent = ICON_MAP[iconName] || FavoriteIcon;
    return <IconComponent />;
  };

  if (loading && categories.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Upravljanje Kategorijama</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={fetchCategories}>Osvježi</button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            <AddIcon style={{ fontSize: 18, marginRight: 4 }} /> Dodaj Kategoriju
          </button>
        </div>
      </div>

      {/* Form (Add or Edit) */}
      {(editingCategory || isAdding) && (
        <div className="admin-form-card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
            {editingCategory ? `📝 Uredi Kategoriju: ${editingCategory.name}` : '✨ Nova Kategorija'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Naziv Kategorije *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  placeholder="npr. Mentalno zdravlje"
                />
              </div>

              <div className="form-group">
                <label>Ikona</label>
                <select name="icon" value={form.icon} onChange={handleInputChange} style={{ height: 42 }}>
                  {Object.keys(ICON_MAP).map((key) => (
                    <option key={key} value={key}>
                      {key.replace('Icon', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Gradient početna boja (HEX)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    name="gradient_start"
                    value={form.gradient_start}
                    onChange={handleInputChange}
                    style={{ width: 44, padding: 0, height: 42, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    name="gradient_start"
                    value={form.gradient_start}
                    onChange={handleInputChange}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Gradient završna boja (HEX)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    name="gradient_end"
                    value={form.gradient_end}
                    onChange={handleInputChange}
                    style={{ width: 44, padding: 0, height: 42, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    name="gradient_end"
                    value={form.gradient_end}
                    onChange={handleInputChange}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Poredak sortiranja</label>
                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {editingCategory ? 'Spremi Promjene' : 'Dodaj Kategoriju'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingCategory(null);
                  setIsAdding(false);
                }}
              >
                Odustani
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Ikona</th>
              <th>Naziv Kategorije</th>
              <th>Gradient Prikaz</th>
              <th>Poredak (Sort)</th>
              <th style={{ width: 160 }}>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${cat.gradient_start}22, ${cat.gradient_end}22)`,
                      color: cat.gradient_start,
                    }}
                  >
                    {renderIcon(cat.icon)}
                  </div>
                </td>
                <td style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1rem' }}>
                  {cat.name}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 80,
                        height: 18,
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${cat.gradient_start}, ${cat.gradient_end})`,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {cat.gradient_start} → {cat.gradient_end}
                    </span>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{cat.sort_order}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleEditClick(cat)}
                    >
                      <EditIcon style={{ fontSize: 14 }} />
                      Uredi
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#ef4444', borderColor: '#fee2e2' }}
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                      Obriši
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
