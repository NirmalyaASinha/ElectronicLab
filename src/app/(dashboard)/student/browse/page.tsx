'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';
import { useRequestStore } from '@/store/requestStore';
import { Search, Plus, Check } from 'lucide-react';

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
  maxIssueQuantity: number;
  maxIssueDays: number;
}

export const dynamic = 'force-dynamic';

export default function BrowseComponents() {
  const store = useRequestStore();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const templates = [
    {
      name: 'Project Starter Kit',
      keywords: ['arduino', 'breadboard', 'sensor', 'jumper', 'resistor'],
      description: 'Common items used in first-stage project builds.',
    },
    {
      name: 'Measurement Kit',
      keywords: ['multimeter', 'oscilloscope', 'power supply', 'probe'],
      description: 'Tools useful for testing and troubleshooting.',
    },
    {
      name: 'Prototype Kit',
      keywords: ['led', 'wire', 'breadboard', 'module', 'motor'],
      description: 'A lightweight kit for rapid prototype assembly.',
    },
  ];

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const res = await fetch('/api/components');
        const data = await res.json();
        if (data.data) {
          const uniqueCategories = [...new Set(data.data.map((c: Component) => c.category))];
          setCategories(uniqueCategories as string[]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchAllCategories();
  }, []);

  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const res = await fetch(`/api/components?${params}`);
      const data = await res.json();
      
      if (data.data) {
        setComponents(data.data);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

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

  const handleAddToRequest = (component: Component) => {
    if (component.status === 'OUT_OF_STOCK') {
      alert('This component is out of stock');
      return;
    }
    
    const existing = store.getItem(component.id);
    
    if (existing) {
      // Item already exists, increment quantity
      if (existing.quantity < existing.maxQuantity) {
        store.updateQuantity(component.id, existing.quantity + 1);
      } else {
        alert(`Maximum quantity (${existing.maxQuantity}) reached for this component`);
      }
    } else {
      // New item, add it
      store.addItem({
        componentId: component.id,
        name: component.name,
        category: component.category,
        quantity: 1,
        maxQuantity: component.maxIssueQuantity,
        maxDays: component.maxIssueDays,
      });
    }
  };

  const isInRequest = (componentId: string) => {
    return store.getItem(componentId) !== null;
  };

  const getItemQuantity = (componentId: string) => {
    const item = store.getItem(componentId);
    return item?.quantity || 0;
  };

  const applyTemplate = (templateKeywords: string[]) => {
    const matchedComponents = components.filter((component) => {
      const haystack = `${component.name} ${component.category} ${component.description ?? ''}`.toLowerCase();
      return templateKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    });

    if (matchedComponents.length === 0) {
      alert('No matching components found for this template in the current list.');
      return;
    }

    matchedComponents.slice(0, 5).forEach((component) => {
      store.addItem({
        componentId: component.id,
        name: component.name,
        category: component.category,
        quantity: 1,
        maxQuantity: component.maxIssueQuantity,
        maxDays: component.maxIssueDays,
      });
    });
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
              className="w-full pl-10 pr-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === ''
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Request Templates */}
        <div className="space-y-4 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Request Templates</h2>
            <p className="text-sm text-[var(--text-secondary)]">Quickly prefill common component bundles</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => applyTemplate(template.keywords)}
                className="text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] transition-all"
              >
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{template.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Recommended Components</h2>
            <p className="text-sm text-[var(--text-secondary)]">Popular and available items worth checking first</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {components
              .filter((component) => component.status !== 'OUT_OF_STOCK')
              .slice(0, 3)
              .map((component) => (
                <div key={component.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <h3 className="font-semibold text-[var(--text-primary)]">{component.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{component.category}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    Available {component.quantityAvailable}/{component.quantityTotal} · Max {component.maxIssueDays} days
                  </p>
                </div>
              ))}
          </div>
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
              {components.map((component) => {
                const inRequest = isInRequest(component.id);
                const quantity = getItemQuantity(component.id);

                return (
                  <StaggerItem key={component.id}>
                    <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-300 group cursor-pointer h-full flex flex-col">
                      {/* Image placeholder */}
                      <div className="w-full h-32 bg-[var(--bg-elevated)] rounded-lg mb-4 flex items-center justify-center group-hover:bg-[var(--accent-glow)] transition-colors">
                        {component.imageUrl ? (
                          <Image
                            src={component.imageUrl}
                            alt={component.name}
                            width={160}
                            height={128}
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

                      {/* Status Badge & Action Button */}
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(component.status)}`}>
                          {component.status}
                        </span>
                        <button
                          onClick={() => handleAddToRequest(component)}
                          disabled={component.status === 'OUT_OF_STOCK'}
                          className={`px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                            component.status === 'OUT_OF_STOCK'
                              ? 'bg-[var(--text-muted)] text-[var(--text-secondary)] cursor-not-allowed'
                              : inRequest
                              ? 'bg-[var(--success)] text-white hover:bg-opacity-90'
                              : 'bg-[var(--accent)] text-white hover:bg-opacity-90'
                          }`}
                        >
                          {inRequest ? <Check size={16} /> : <Plus size={16} />}
                          <span>Request {quantity > 0 ? `• ${quantity}` : ''}</span>
                        </button>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
