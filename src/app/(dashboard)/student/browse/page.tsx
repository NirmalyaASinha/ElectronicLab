'use client';

import { useEffect, useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';
import { Search } from 'lucide-react';

interface Component {
  id: string;
  name: string;
  category: string;
  description?: string;
  modelNumber?: string;
  quantityAvailable: number;
  quantityTotal: number;
  status: string;
  imageUrl?: string;
}

export const dynamic = 'force-dynamic';

export default function BrowseComponents() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchComponents();
  }, [search, category]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const res = await fetch(`/api/components?${params}`);
      const data = await res.json();
      
      if (data.data) {
        setComponents(data.data);
        // Extract unique categories
        const uniqueCategories = [...new Set(data.data.map((c: Component) => c.category))];
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-[var(--success)] text-[var(--bg-base)]';
      case 'LOW_STOCK':
        return 'bg-[var(--warning)] text-[var(--bg-base)]';
      case 'OUT_OF_STOCK':
        return 'bg-[var(--danger)] text-white';
      default:
        return 'bg-[var(--text-secondary)] text-white';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Browse Components 📦
          </h1>
          <p className="text-[var(--text-secondary)]">
            Explore available electronics components in the lab
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[var(--text-secondary)]" size={20} />
            <input
              type="text"
              placeholder="Search by name or model number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Components Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">Loading components...</p>
          </div>
        ) : components.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">No components found. Try adjusting your filters.</p>
          </div>
        ) : (
          <StaggerContainer staggerDelay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {components.map((component) => (
                <StaggerItem key={component.id}>
                  <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-300 group cursor-pointer h-full flex flex-col">
                    {/* Image placeholder */}
                    <div className="w-full h-32 bg-[var(--bg-elevated)] rounded-lg mb-4 flex items-center justify-center group-hover:bg-[var(--accent-glow)] transition-colors">
                      {component.imageUrl ? (
                        <img
                          src={component.imageUrl}
                          alt={component.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                      {component.name}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] mb-3 flex-grow">
                      {component.description || 'No description available'}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      {component.modelNumber && (
                        <p className="text-[var(--text-secondary)]">
                          <span className="text-[var(--text-muted)]">Model:</span> {component.modelNumber}
                        </p>
                      )}
                      <p className="text-[var(--text-secondary)]">
                        <span className="text-[var(--text-muted)]">Category:</span> {component.category}
                      </p>
                      <p className="text-[var(--text-secondary)]">
                        <span className="text-[var(--text-muted)]">Available:</span>{' '}
                        <span className="font-semibold text-[var(--accent)]">
                          {component.quantityAvailable}/{component.quantityTotal}
                        </span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(component.status)}`}>
                        {component.status}
                      </span>
                      <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium">
                        Request
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
