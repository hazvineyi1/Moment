import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useListInvites, useGenerateInvite } from '@workspace/api-client-react';
import { Mail, Send, ChevronLeft, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export function EventInvites() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = parseInt(eventId, 10);
  
  const [style, setStyle] = useState('elegant');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: invites, isLoading, refetch } = useListInvites(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'invites'] }
  });

  const generate = useGenerateInvite();

  const handleGenerate = () => {
    generate.mutate({
      eventId: id,
      data: { style }
    }, {
      onSuccess: () => refetch()
    });
  };

  const copyToClipboard = (text: string, inviteId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const styles = [
    { id: 'elegant', label: 'Elegant', desc: 'Formal and refined' },
    { id: 'casual', label: 'Casual', desc: 'Warm and relaxed' },
    { id: 'playful', label: 'Playful', desc: 'Fun and energetic' },
    { id: 'mysterious', label: 'Mysterious', desc: 'Intriguing and short' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/events/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-medium">Invitations</h1>
          <p className="text-muted-foreground">Draft perfect messages for WhatsApp or Email</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 mb-12">
        <h2 className="font-serif text-xl mb-6">Create a new invite draft</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {styles.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                style === s.id 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-border/60 hover:border-primary/40'
              }`}
            >
              <div className="font-medium mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
          >
            {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Draft
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="font-serif text-2xl">Saved Drafts</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : !invites || invites.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border/60 rounded-3xl">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No drafts yet. Generate your first invite above.</p>
          </div>
        ) : (
          invites.map(invite => (
            <div key={invite.id} className="bg-background rounded-3xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="font-serif font-medium text-lg">{invite.title}</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {invite.style}
                  </span>
                </div>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FaWhatsapp className="w-4 h-4 text-[#25D366]" /> WhatsApp Format
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(invite.whatsappText, invite.id)}
                      className="text-xs flex items-center gap-1.5 text-primary font-medium hover:underline"
                    >
                      {copiedId === invite.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === invite.id ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                  <div className="bg-green-50 dark:bg-[#111b21] p-4 rounded-xl rounded-tl-sm border border-green-100 dark:border-white/5 relative">
                    <p className="whitespace-pre-wrap text-sm md:text-base text-gray-800 dark:text-gray-200 font-sans">{invite.whatsappText}</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <a 
                      href={invite.whatsappLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#20bd5a] transition-colors shadow-sm shadow-green-500/20"
                    >
                      <Send className="w-4 h-4" /> Send via WhatsApp
                    </a>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email / Long Format
                    </h3>
                  </div>
                  <div className="bg-card p-6 rounded-xl border border-border/50 font-serif">
                    <p className="whitespace-pre-wrap leading-relaxed">{invite.message}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
