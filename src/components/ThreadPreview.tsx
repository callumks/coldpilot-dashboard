import React from 'react';

interface ThreadPreviewProps {
  id: number;
  sender: string;
  company: string;
  subject: string;
  preview: string;
  time: string;
  isUnread: boolean;
}

const ThreadPreview: React.FC<ThreadPreviewProps> = ({
  sender,
  company,
  subject,
  preview,
  time,
  isUnread,
}) => {
  return (
    <div className={`p-3 rounded-lg transition-colors cursor-pointer border min-w-0 ${
      isUnread 
        ? 'bg-gray-800 border-primary-500/30 shadow-card' 
        : 'bg-gray-850/50 border-gray-800 hover:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h4 className={`text-sm font-medium truncate ${
              isUnread ? 'text-white' : 'text-gray-300'
            }`}>
              {sender}
            </h4>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500 truncate">{company}</span>
            {isUnread && (
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
            )}
          </div>
          
          <p className={`text-sm truncate line-clamp-1 mb-1 ${
            isUnread ? 'text-gray-200 font-medium' : 'text-gray-400'
          }`}>
            {subject}
          </p>
          
          <p className="text-xs text-gray-500 break-words line-clamp-2">
            {preview}
          </p>
        </div>
        
        <div className="ml-3 flex-shrink-0">
          <span className="text-xs text-gray-500">{time}</span>
        </div>
      </div>
    </div>
  );
};

export default ThreadPreview; 