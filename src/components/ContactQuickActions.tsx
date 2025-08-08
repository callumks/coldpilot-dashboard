'use client';

import React, { useState } from 'react';
import { Edit3, MessageCircle, Trash2, MoreHorizontal, CheckCircle2 } from 'lucide-react';

interface ContactQuickActionsProps {
  contact: {
    id: number;
    name: string;
    email: string;
    company?: string;
  };
  onEdit: (contact: any) => void;
  onMessage: (contact: any) => void;
  onDelete: (contactId: number) => void;
  onMarkContacted?: (contactId: number) => void;
  isVisible: boolean;
}

const ContactQuickActions: React.FC<ContactQuickActionsProps> = ({
  contact,
  onEdit,
  onMessage,
  onDelete,
  onMarkContacted,
  isVisible
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(contact);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMessage(contact);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(contact.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`flex items-center justify-end gap-1 transition-all duration-200 min-w-[140px] ${!isVisible && !showDeleteConfirm ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {showDeleteConfirm ? (
        // Delete confirmation state
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1">
          <span className="text-xs text-red-300">Delete?</span>
          <button
            onClick={handleDelete}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
            title="Confirm delete"
          >
            Yes
          </button>
          <button
            onClick={handleCancelDelete}
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
            title="Cancel"
          >
            No
          </button>
        </div>
      ) : (
        // Normal action buttons
        <>
          <button
            onClick={handleEdit}
            className="p-2 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 group"
            title="Edit contact"
          >
            <Edit3 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={handleMessage}
            className="p-2 hover:bg-green-500/10 text-green-400 hover:text-green-300 rounded-lg transition-all duration-200 group"
            title="Send message"
          >
            <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onMarkContacted && onMarkContacted(contact.id); }}
            className="p-2 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all duration-200 group"
            title="Mark as Contacted"
          >
            <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 group"
            title="Delete contact"
          >
            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            className="p-2 hover:bg-gray-500/10 text-gray-400 hover:text-gray-300 rounded-lg transition-all duration-200 group"
            title="More actions"
          >
            <MoreHorizontal className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}
    </div>
  );
};

export default ContactQuickActions; 