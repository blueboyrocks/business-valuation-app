'use client';

import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';

interface EditableSectionProps {
  content: string;
  sectionName: string;
  reportId: string;
  markdownComponents: Components;
  onUpdate?: (newContent: string) => void;
}

export default function EditableSection({
  content,
  sectionName,
  reportId,
  markdownComponents,
  onUpdate,
}: EditableSectionProps) {
  const [currentContent, setCurrentContent] = useState(content);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSave = async (newContent: string) => {
    try {
      // Get auth token
      const { createBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call API to update section
      const response = await fetch(`/api/reports/${reportId}/update-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sectionName,
          content: newContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // Update local state
      setCurrentContent(newContent);
      setIsEditMode(false);

      // Notify parent component
      if (onUpdate) {
        onUpdate(newContent);
      }

    } catch (error) {
      console.error('Error saving section:', error);
      throw error;
    }
  };

  if (isEditMode) {
    return (
      <div className="mt-4">
        <RichTextEditor
          content={currentContent}
          onSave={handleSave}
          sectionName={sectionName}
        />
        <button
          onClick={() => setIsEditMode(false)}
          className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Display content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={markdownComponents}
      >
        {currentContent || 'No content available'}
      </ReactMarkdown>

      {/* Edit button (appears on hover) */}
      <button
        onClick={() => setIsEditMode(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Edit
      </button>
    </div>
  );
}
