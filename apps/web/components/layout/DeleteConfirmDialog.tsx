'use client';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  hasChildren: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  hasChildren,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-void-black border border-warm-ivory/20 p-6 max-w-md w-full mx-4">
        <h2 className="font-display text-xl font-bold text-warm-ivory mb-4">
          Delete Page
        </h2>
        <p className="text-warm-ivory/80 mb-2">
          Are you sure you want to delete &ldquo;{title}&rdquo;?
        </p>
        {hasChildren && (
          <p className="text-red-400 text-sm mb-4">
            Warning: This will also delete all subpages.
          </p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-warm-ivory/60 hover:text-warm-ivory border border-warm-ivory/20 hover:border-warm-ivory/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
