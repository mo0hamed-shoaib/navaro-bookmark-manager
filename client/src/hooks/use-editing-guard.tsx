import { useEditing } from '@/contexts/editing-context';
import { useToast } from '@/hooks/use-toast';

export function useEditingGuard() {
  const { isEditingEnabled } = useEditing();
  const { toast } = useToast();

  const guardAction = (action: string, callback: () => void) => {
    if (isEditingEnabled) {
      callback();
    } else {
      toast({
        title: "Editing Locked",
        description: `Unlock editing to ${action}.`,
        variant: "destructive",
      });
    }
  };

  return { guardAction, isEditingEnabled };
}
