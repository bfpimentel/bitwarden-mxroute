import { Trash2 } from "lucide-react";

interface ForwarderItemProps {
  email: string;
  onDelete: (email: string) => void;
}

export const ForwarderItem = ({ email, onDelete }: ForwarderItemProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
      <span className="text-gray-700 font-medium">{email}</span>
      <button
        onClick={() => onDelete(email)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
        title="Delete forwarder"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
};
