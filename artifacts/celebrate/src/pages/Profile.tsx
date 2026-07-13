import React, { useState, useEffect } from 'react';
import { useGetProfile, useUpdateProfile } from '@workspace/api-client-react';
import { User, Loader2, Save, MapPin, Phone, Mail, Sparkles } from 'lucide-react';

export function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    personality: '',
    preferences: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        personality: profile.personality || '',
        preferences: profile.preferences || ''
      });
    }
  }, [profile]);

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      data: formData
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-end justify-between mb-12 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-medium mb-2">Your Identity</h1>
          <p className="text-muted-foreground">Cele uses this to personalize recommendations</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/80 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            <User className="w-12 h-12 text-primary/40" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 mix-blend-overlay" />
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Full Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full text-2xl md:text-3xl font-serif bg-transparent border-b border-transparent focus:border-primary outline-none py-1 disabled:opacity-90"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border/50">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="Location"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="bg-transparent w-full outline-none text-sm disabled:opacity-90"
                />
              </div>
              <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  disabled={!isEditing}
                  placeholder="Email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-transparent w-full outline-none text-sm disabled:opacity-90"
                />
              </div>
              <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border/50 md:col-span-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  disabled={!isEditing}
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="bg-transparent w-full outline-none text-sm disabled:opacity-90"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Deep Context */}
        <section className="bg-card rounded-3xl p-8 border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-24 h-24 text-primary" />
          </div>
          
          <h3 className="font-serif text-2xl mb-6 relative z-10">Planning Context</h3>
          
          <div className="space-y-6 relative z-10">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                Short Bio
              </label>
              <textarea
                disabled={!isEditing}
                rows={3}
                placeholder="A bit about you..."
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary disabled:opacity-80 resize-none"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                Vibe & Personality
              </label>
              <p className="text-xs text-muted-foreground mb-3">E.g., "Extroverted, loves late dinners, hates tourist traps"</p>
              <textarea
                disabled={!isEditing}
                rows={3}
                value={formData.personality}
                onChange={e => setFormData({...formData, personality: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary disabled:opacity-80 resize-none font-serif italic"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                Travel & Taste Preferences
              </label>
              <p className="text-xs text-muted-foreground mb-3">Dietary needs, budget habits, favorite hotel brands, etc.</p>
              <textarea
                disabled={!isEditing}
                rows={3}
                value={formData.preferences}
                onChange={e => setFormData({...formData, preferences: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary disabled:opacity-80 resize-none"
              />
            </div>
          </div>
        </section>

        {isEditing && (
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (profile) {
                  setFormData({
                    name: profile.name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    location: profile.location || '',
                    bio: profile.bio || '',
                    personality: profile.personality || '',
                    preferences: profile.preferences || ''
                  });
                }
              }}
              className="px-6 py-3 rounded-full font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 shadow-sm"
            >
              {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
