import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { useEditing } from '@/contexts/editing-context';
import { PasswordDialog } from './password-dialog';
import { useToast } from '@/hooks/use-toast';

export function EditingToggle() {
  const { isEditingEnabled, disableEditing } = useEditing();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleClick = () => {
    if (isEditingEnabled) {
      disableEditing();
      toast({
        title: "Editing Locked",
        description: "All editing functionality has been disabled.",
      });
    } else {
      setPasswordDialogOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        title={isEditingEnabled ? "Lock editing" : "Unlock editing"}
        className="flex-shrink-0"
      >
        {isEditingEnabled ? (
          <Unlock className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </Button>
      
      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  );
}
