import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Filter, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/constants/animation';
import { TalentContactCard } from '@/components/talent/TalentContactCard';
import { TalentContactForm } from '@/components/talent/TalentContactForm';
import { ReferralForm } from '@/components/talent/ReferralForm';
import { useTalentContacts, type TalentContactWithSkills } from '@/hooks/useTalentContacts';
import { useSkills } from '@/hooks/useSkills';
import { useTalentReferrals } from '@/hooks/useTalentReferrals';

interface NetworkScreenProps {
  className?: string;
}

export const NetworkScreen = ({ className }: NetworkScreenProps) => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [referralFormOpen, setReferralFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<TalentContactWithSkills | undefined>();
  const [referralContact, setReferralContact] = useState<TalentContactWithSkills | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<TalentContactWithSkills | undefined>();

  const { contacts, loading, createContact, updateContact, deleteContact } = useTalentContacts(selectedSkill);
  const { skills, getCategories } = useSkills();
  const { createReferral } = useTalentReferrals();

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.specialty_summary?.toLowerCase().includes(query) ||
      contact.skills.some(skill => skill.name.toLowerCase().includes(query))
    );
  });

  const handleAddContact = () => {
    setEditingContact(undefined);
    setContactFormOpen(true);
  };

  const handleEditContact = (contact: TalentContactWithSkills) => {
    setEditingContact(contact);
    setContactFormOpen(true);
  };

  const handleDeleteContact = (contact: TalentContactWithSkills) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (contactToDelete) {
      await deleteContact(contactToDelete.id);
      setDeleteDialogOpen(false);
      setContactToDelete(undefined);
    }
  };

  const handleLogReferral = (contact: TalentContactWithSkills) => {
    setReferralContact(contact);
    setReferralFormOpen(true);
  };

  const handleContactFormSubmit = async (contactData: any, skillIds: string[]) => {
    if (editingContact) {
      await updateContact(editingContact.id, contactData, skillIds);
    } else {
      await createContact(contactData, skillIds);
    }
  };

  const handleReferralFormSubmit = async (referralData: any) => {
    await createReferral(referralData);
  };

  // Get unique categories with contact counts
  const categories = getCategories();
  const skillCounts = skills.reduce((acc, skill) => {
    const count = contacts.filter(c => c.skills.some(s => s.id === skill.id)).length;
    acc[skill.id] = count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <motion.div
        className={cn('flex flex-col gap-4 p-4 pb-24', className)}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <motion.div variants={staggerItem} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Network</h1>
            <p className="text-sm text-muted-foreground">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your network
            </p>
          </div>
          <Button onClick={handleAddContact} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </motion.div>

        {/* Search Bar */}
        <motion.div variants={staggerItem}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Skill Filter Chips */}
        <motion.div variants={staggerItem}>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              <Badge
                variant={selectedSkill === null ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2"
                onClick={() => setSelectedSkill(null)}
              >
                All ({contacts.length})
              </Badge>
              {skills
                .filter(skill => skillCounts[skill.id] > 0)
                .map(skill => (
                  <Badge
                    key={skill.id}
                    variant={selectedSkill === skill.id ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => setSelectedSkill(skill.id)}
                  >
                    {skill.name} ({skillCounts[skill.id]})
                  </Badge>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>

        {/* Contact Grid */}
        {loading ? (
          <motion.div variants={staggerItem} className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          </motion.div>
        ) : filteredContacts.length === 0 ? (
          <motion.div variants={staggerItem} className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || selectedSkill ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedSkill
                  ? 'Try adjusting your filters'
                  : 'Start building your network by adding your first contact'}
              </p>
              {!searchQuery && !selectedSkill && (
                <Button onClick={handleAddContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredContacts.map(contact => (
              <motion.div key={contact.id} variants={staggerItem}>
                <TalentContactCard
                  contact={contact}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                  onLogReferral={handleLogReferral}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Contact Form Dialog */}
      <TalentContactForm
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        onSubmit={handleContactFormSubmit}
        contact={editingContact}
      />

      {/* Referral Form Dialog */}
      {referralContact && (
        <ReferralForm
          open={referralFormOpen}
          onOpenChange={setReferralFormOpen}
          onSubmit={handleReferralFormSubmit}
          contact={referralContact}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contactToDelete?.name}? This action cannot be undone.
              All referrals associated with this contact will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
