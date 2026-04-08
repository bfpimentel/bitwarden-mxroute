import { Trash2, ArrowRight } from "lucide-react";

interface ForwarderItemProps {
  email: string;
  destinations: string[];
  onDelete: (email: string) => void;
}

export const ForwarderItem = ({ email, destinations, onDelete }: ForwarderItemProps) => {
  return (
    <div className="px-4 py-3 hover:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium break-all">{email}</span>
        <button
          onClick={() => onDelete(email)}
          className="p-1 border-2 border-white hover:bg-white hover:text-black transition-colors shrink-0 ml-2"
          title="Delete forwarder"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {destinations && destinations.length > 0 && (
        <div className="text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              {destinations.map((dest, idx) => (
                <span key={idx} className="border border-white px-2 py-0.5 text-xs w-fit">
                  {dest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
